"""
RemindAR Backend - FastAPI Server
Main entry point for the AR memory assistant backend.

Handles:
- WebSocket connections for real-time face data
- Face recognition pipeline
- Identity + memory context responses
- Gemini Flash integration for reflection/summarization (NOT realtime)
"""

import json
import asyncio
import time
from typing import Dict, Set, List, Optional
from contextlib import asynccontextmanager
from dataclasses import dataclass, field

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    Person, 
    PersonCreate, 
    FaceData, 
    RecognitionResult,
    WebSocketMessage
)
from database import (
    init_database, 
    seed_demo_data, 
    add_person, 
    get_all_people,
    get_person,
    update_embedding,
    delete_person
)
from face_recognition import get_recognizer
from firebase_sync import (
    init_firebase,
    sync_person_to_firebase,
    sync_embedding_to_firebase,
    delete_person_from_firebase,
    add_update_listener,
    notify_update
)

# Gemini Flash integration for reflection/summarization (NOT realtime)
from gemini_service import (
    generate_conversation_summary_with_gemini,
    normalize_memory_with_gemini,
    translate_and_summarize_with_gemini,
    generate_dashboard_insights_with_gemini,
    local_fallback_summary,
    NormalizedMemory,
    DashboardInsights
)


# ============================================================================
# Conversation Buffer Tracking (for Gemini summarization)
# ============================================================================

@dataclass
class ConversationSession:
    """Tracks an active conversation for Gemini summarization."""
    transcript_buffer: List[str] = field(default_factory=list)
    last_speech_time: float = 0.0
    person_name: Optional[str] = None
    is_active: bool = False

# Track conversation buffers per client/session
conversation_sessions: Dict[str, ConversationSession] = {}

# Silence threshold for triggering Gemini summary (seconds)
SILENCE_THRESHOLD_SECONDS = 5.0


# ============================================================================
# Application Lifecycle
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown handler.
    Flow: Firestore → SQLite → In-Memory Cache
    """
    print("[Server] Starting RemindAR backend...")
    
    # Initialize database
    init_database()
    
    # Initialize Firebase
    print("[Server] Initializing Firebase...")
    firebase_ok = init_firebase()
    if firebase_ok:
        add_update_listener(broadcast_update)
        
        # Sync Firestore → SQLite (synchronous, blocks until complete)
        print("[Server] Syncing Firestore → SQLite...")
        from firebase_sync import get_all_people_from_firebase
        from database import sync_from_firestore
        
        firestore_people = get_all_people_from_firebase()
        if firestore_people:
            sync_from_firestore(firestore_people)
            print(f"[Server] Synced {len(firestore_people)} people from Firestore")
        else:
            print("[Server] No data in Firestore, using SQLite only...")
    
    # Check if we have data
    people = get_all_people()
    print(f"[Server] SQLite has {len(people)} people")
    
    # Initialize face recognizer
    print("[Server] Initializing face recognition model...")
    recognizer = get_recognizer()
    
    # Load cache from SQLite (fastest)
    print("[Server] Loading cache from SQLite...")
    recognizer.load_cache_from_database()
    
    print("[Server] Backend ready!")
    
    yield
    
    # Cleanup
    print("[Server] Shutting down...")
    recognizer.clear_cache()



# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="RemindAR API",
    description="AI-powered AR memory assistant backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    """
    Manages active WebSocket connections.
    Supports multiple simultaneous clients (e.g., multiple AR glasses).
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")
    
    async def send_json(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception as e:
            print(f"[WS] Send error: {e}")


manager = ConnectionManager()


# Broadcast function for Firebase sync updates
def broadcast_update(event_type: str, data: dict):
    """Broadcast an update to all connected WebSocket clients."""
    message = {
        "type": "sync_update",
        "event": event_type,
        "data": data
    }
    
    # Run async broadcast in event loop
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(broadcast_to_all(message))
        else:
            loop.run_until_complete(broadcast_to_all(message))
    except RuntimeError:
        # No event loop, skip broadcast
        pass


async def broadcast_to_all(message: dict):
    """Send message to all connected clients."""
    for ws in list(manager.active_connections):
        try:
            await ws.send_json(message)
        except Exception as e:
            print(f"[WS] Broadcast error: {e}")
            manager.active_connections.discard(ws)


# ============================================================================
# Helper Functions
# ============================================================================

def format_display_lines(person: dict, is_known: bool, confidence: float) -> list:
    """
    Format the display lines for AR overlay.
    Maximum 3 lines, calm and clear formatting.
    """
    if not is_known:
        return [
            "New Person",
            "Not yet recognized",
            ""
        ]
    
    # Format for known person
    lines = [
        person.get("name", "Unknown"),
        person.get("relation", ""),
        person.get("context", "")[:50]  # Truncate long context
    ]
    
    return lines


def build_recognition_result(
    track_id: str,
    person: dict | None,
    confidence: float
) -> dict:
    """Build the recognition result response."""
    is_known = person is not None
    
    result = RecognitionResult(
        track_id=track_id,
        is_known=is_known,
        confidence=confidence,
        person=Person(**person) if person else None,
        display_lines=format_display_lines(person, is_known, confidence)
    )
    
    return result.model_dump()


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time face recognition.
    
    Protocol:
    - Client sends: {"type": "face_data", "data": {...}}
    - Server responds: {"type": "recognition_result", "data": {...}}
    """
    await manager.connect(websocket)
    recognizer = get_recognizer()
    
    try:
        while True:
            # Receive message
            raw_message = await websocket.receive_text()
            
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue
            
            msg_type = message.get("type")
            data = message.get("data", {})
            
            # Handle different message types
            if msg_type == "ping":
                await manager.send_json(websocket, {"type": "pong"})
                
            elif msg_type == "face_data":
                # Process face recognition
                track_id = data.get("track_id", "unknown")
                image_base64 = data.get("image_base64", "")
                
                if not image_base64:
                    continue
                
                print(f"[WS] Processing face: {track_id[:20]}...")
                
                # Run recognition
                person, confidence, embedding = recognizer.recognize(image_base64)
                
                # Log result
                name = person.get("name", "Unknown") if person else "Unknown"
                print(f"[WS] Recognized: {name} ({confidence:.2f})")
                
                # Build and send result
                result = build_recognition_result(track_id, person, confidence)
                
                await manager.send_json(websocket, {
                    "type": "recognition_result",
                    "data": result
                })
                print(f"[WS] Sent result for {track_id[:20]}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(websocket)


# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "RemindAR API"}


@app.get("/health")
async def health():
    """Detailed health check."""
    recognizer = get_recognizer()
    return {
        "status": "healthy",
        "model_loaded": recognizer.model is not None,
        "people_count": len(get_all_people()),
        "cache_count": recognizer.get_cache_count()
    }


@app.post("/refresh-cache")
async def refresh_cache():
    """Clear and reload the face embedding cache."""
    recognizer = get_recognizer()
    recognizer.load_cache_from_database()
    return {
        "status": "refreshed",
        "cache_count": recognizer.get_cache_count()
    }


@app.post("/transcribe")
async def transcribe_audio(audio_data: bytes = None):
    """
    Transcribe audio to text using local Whisper.
    Accepts raw audio bytes (WAV format).
    """
    from speech_to_text import get_stt
    from fastapi import Request
    
    # This endpoint needs to be handled differently for raw bytes
    # We'll use a separate approach with UploadFile
    pass


from fastapi import File, UploadFile

@app.post("/api/transcribe")
async def api_transcribe(audio: UploadFile = File(...)):
    """
    Transcribe uploaded audio file to text using Gemini.
    
    REPLACES: Whisper STT
    
    Benefits:
    - Native Hindi/Hinglish support
    - Better accuracy for mixed languages
    - Cloud-based (no local model needed)
    
    Accepts WAV, MP3, or WebM audio.
    """
    from gemini_stt import transcribe_and_extract_with_gemini
    
    # Read audio data
    audio_bytes = await audio.read()
    
    # Determine MIME type
    mime_type = audio.content_type or "audio/webm"
    if audio.filename:
        if audio.filename.endswith(".wav"):
            mime_type = "audio/wav"
        elif audio.filename.endswith(".mp3"):
            mime_type = "audio/mp3"
        elif audio.filename.endswith(".webm"):
            mime_type = "audio/webm"
    
    print(f"[API] Transcribing audio: {len(audio_bytes)} bytes, type: {mime_type}")
    
    # Transcribe AND extract with Gemini (single call)
    result = await transcribe_and_extract_with_gemini(audio_bytes, mime_type)
    
    if not result.success:
        return {
            "text": "",
            "success": False,
            "error": "Gemini transcription failed"
        }
    
    return {
        "text": result.text,
        "success": True,
        "language": result.language,
        # Also return extracted fields for convenience
        "name": result.name,
        "relation": result.relation,
        "context": result.context,
        "source": "gemini"
    }


@app.post("/api/transcribe-and-extract")
async def api_transcribe_and_extract(audio: UploadFile = File(...)):
    """
    Transcribe audio AND extract structured info in ONE Gemini call.
    
    REPLACES: Whisper (transcription) + Phi-3 (extraction)
    
    This is the new primary endpoint for voice input.
    Handles English, Hindi, Hinglish seamlessly.
    
    Returns:
    - text: Full transcription
    - name: Extracted person name
    - relation: Extracted relationship
    - context: Extracted context/memory
    - language: Detected language (en, hi, hinglish)
    """
    from gemini_stt import transcribe_and_extract_with_gemini
    
    audio_bytes = await audio.read()
    
    # Determine MIME type
    mime_type = audio.content_type or "audio/webm"
    if audio.filename:
        if audio.filename.endswith(".wav"):
            mime_type = "audio/wav"
        elif audio.filename.endswith(".mp3"):
            mime_type = "audio/mp3"
        elif audio.filename.endswith(".webm"):
            mime_type = "audio/webm"
    
    print(f"[API] Transcribe+Extract: {len(audio_bytes)} bytes, type: {mime_type}")
    
    result = await transcribe_and_extract_with_gemini(audio_bytes, mime_type)
    
    return {
        "text": result.text,
        "name": result.name,
        "relation": result.relation,
        "context": result.context,
        "language": result.language,
        "success": result.success,
        "source": "gemini"
    }


from pydantic import BaseModel

class ExtractionRequest(BaseModel):
    text: str

@app.post("/api/extract")
async def api_extract(request: ExtractionRequest):
    """
    Extract structured info (name, relation, context) from text.
    
    Now uses Gemini for better multilingual and context understanding.
    Falls back to Phi-3 if Gemini unavailable.
    """
    from gemini_service import normalize_memory_with_gemini
    
    if not request.text or not request.text.strip():
        return {
            "name": None,
            "relation": None,
            "context": None,
            "success": False
        }
    
    # Use Gemini for extraction (better multilingual support)
    result = await normalize_memory_with_gemini(
        name=None,  # Extract from text
        relation=None,
        context=request.text  # Pass full text as context for extraction
    )
    
    # If Gemini didn't extract well, fall back to Phi
    if not result.was_normalized or not any([result.name, result.relation]):
        from llm_extraction import extract_info_async
        phi_result = await extract_info_async(request.text)
        return {
            "name": phi_result.name,
            "relation": phi_result.relation,
            "context": phi_result.context,
            "success": any([phi_result.name, phi_result.relation, phi_result.context]),
            "source": "phi"
        }
    
    return {
        "name": result.name,
        "relation": result.relation,
        "context": result.context,
        "success": any([result.name, result.relation, result.context]),
        "source": "gemini"
    }





@app.get("/people", response_model=list[Person])
async def list_people():
    """Get all known people."""
    return get_all_people()


@app.get("/people/{person_id}", response_model=Person)
async def get_person_by_id(person_id: str):
    """Get a specific person by ID."""
    person = get_person(person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@app.post("/people", response_model=Person)
async def create_person(person: PersonCreate):
    """
    Create a new person entry.
    Note: Embedding must be added separately via /register-face endpoint.
    """
    import uuid
    person_id = f"person_{uuid.uuid4().hex[:8]}"
    
    success = add_person(
        person_id=person_id,
        name=person.name,
        relation=person.relation,
        last_met=person.last_met,
        context=person.context
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create person")
    
    # Get the created person
    created_person = get_person(person_id)
    
    # Sync to Firebase
    sync_person_to_firebase(created_person)
    
    # Broadcast to all clients for real-time update
    await broadcast_to_all({
        "type": "person_registered",
        "data": created_person
    })
    
    print(f"[API] Created person: {person.name} ({person_id})")
    return created_person


@app.put("/people/{person_id}", response_model=Person)
async def update_person(person_id: str, person: PersonCreate):
    """Update an existing person's details."""
    from database import update_person as db_update_person
    
    existing = get_person(person_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Person not found")
    
    success = db_update_person(
        person_id=person_id,
        name=person.name,
        relation=person.relation,
        last_met=person.last_met,
        context=person.context
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update person")
    
    updated_person = get_person(person_id)
    
    # Update recognizer cache with new person data
    recognizer = get_recognizer()
    recognizer.update_person_data(person_id, updated_person)
    
    # Sync to Firebase
    sync_person_to_firebase(updated_person)
    
    # Broadcast to all clients so UI updates immediately
    await broadcast_to_all({
        "type": "person_updated",
        "data": updated_person
    })
    
    print(f"[API] Updated person: {person.name} ({person_id})")
    return updated_person



@app.post("/register-face/{person_id}")
async def register_face(person_id: str, face_data: FaceData):
    """
    Register a face embedding for an existing person.
    Stores in both SQLite and Firestore for persistence.
    """
    person = get_person(person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    recognizer = get_recognizer()
    embedding = recognizer.get_embedding_from_base64(face_data.image_base64)
    
    if embedding is None:
        raise HTTPException(status_code=400, detail="Could not extract face embedding")
    
    # Save to SQLite
    success = update_embedding(person_id, embedding)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update embedding")
    
    # Add to local cache immediately
    updated_person = get_person(person_id)
    recognizer.add_to_cache(person_id, updated_person, embedding)
    
    # Store embedding in Firestore for persistence
    sync_embedding_to_firebase(person_id, embedding)
    
    # Broadcast for real-time update
    await broadcast_to_all({
        "type": "person_registered",
        "data": updated_person
    })
    
    print(f"[API] Registered face for: {person.get('name')} ({person_id})")
    return {"status": "success", "person_id": person_id, "person": updated_person}


@app.delete("/people/{person_id}")
async def remove_person(person_id: str):
    """Delete a person from the database."""
    success = delete_person(person_id)
    if not success:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Remove from local cache
    recognizer = get_recognizer()
    recognizer.remove_from_cache(person_id)
    
    # Sync deletion to Firebase
    delete_person_from_firebase(person_id)
    
    # Broadcast deletion to all clients
    await broadcast_to_all({
        "type": "person_deleted",
        "data": {"id": person_id}
    })
    
    print(f"[API] Deleted person: {person_id}")
    return {"status": "deleted", "person_id": person_id}


# ============================================================================
# GEMINI FLASH ENDPOINTS (Reflection/Summarization - NOT Realtime)
# ============================================================================
# 
# These endpoints use Gemini Flash for:
# 1. Conversation memory summarization
# 2. Memory normalization & cleanup
# 3. Multilingual handling
# 4. Dashboard intelligence
#
# IMPORTANT: These are NEVER called per-frame or per-second.
# They are triggered by specific events (silence, face leave, button press).
# ============================================================================

class ConversationSummaryRequest(BaseModel):
    """Request for Gemini conversation summarization."""
    transcript: List[str]  # List of transcription lines
    person_name: Optional[str] = None

class TranslateRequest(BaseModel):
    """Request for multilingual translation/summarization."""
    text: str
    source_language: Optional[str] = None

class DashboardInsightsRequest(BaseModel):
    """Request for dashboard insights generation."""
    days: int = 7
    person_id: Optional[str] = None


@app.post("/api/summarize-conversation")
async def summarize_conversation(request: ConversationSummaryRequest):
    """
    Generate a clean English memory summary from conversation transcript.
    
    GEMINI USAGE: This is the primary integration point for Gemini Flash.
    
    TRIGGERS (call this endpoint when):
    - Silence detected for ≥5-7 seconds
    - Face leaves camera frame
    - User presses "Save Memory" button
    
    WHY GEMINI:
    - Understands full conversation context (not just single sentences like Phi)
    - Handles mixed languages (Hindi + English)
    - Generates natural, emotionally neutral summaries
    - Removes filler words while preserving meaning
    
    NOT called per-frame or per-second - only once per conversation.
    """
    if not request.transcript:
        return {"summary": "", "success": False, "error": "Empty transcript"}
    
    print(f"[Gemini] Summarizing conversation: {len(request.transcript)} lines")
    
    # Try Gemini Flash first
    summary = await generate_conversation_summary_with_gemini(
        request.transcript,
        request.person_name
    )
    
    # Fallback to local if Gemini fails
    if not summary:
        summary = local_fallback_summary(request.transcript)
        return {
            "summary": summary,
            "success": True,
            "source": "local_fallback",
            "reason": "Gemini unavailable, used local fallback"
        }
    
    return {
        "summary": summary,
        "success": True,
        "source": "gemini_flash"
    }


@app.post("/api/extract-normalized")
async def extract_and_normalize(request: ExtractionRequest, normalize: bool = True):
    """
    Extract structured info AND optionally normalize with Gemini.
    
    This is an enhanced version of /api/extract that adds Gemini normalization.
    
    FLOW:
    1. Phi-3 extracts raw slots (fast, <2 seconds)
    2. If normalize=True, Gemini cleans up the result:
       - Capitalizes names properly
       - Standardizes relation labels
       - Shortens context to ≤8 words
    
    WHY GEMINI for normalization:
    - Phi-3 outputs raw text that may be lowercase or inconsistent
    - Gemini provides semantic understanding for cleanup
    - Still fast because Phi does the heavy lifting first
    """
    from llm_extraction import extract_info_async
    
    # Step 1: Fast Phi-3 extraction (realtime-safe)
    phi_result = await extract_info_async(request.text)
    
    if not normalize:
        # Return raw Phi result
        return {
            "name": phi_result.name,
            "relation": phi_result.relation,
            "context": phi_result.context,
            "success": any([phi_result.name, phi_result.relation, phi_result.context]),
            "normalized": False
        }
    
    # Step 2: Gemini normalization (reflection-safe)
    print(f"[Gemini] Normalizing extraction: {phi_result.name}, {phi_result.relation}")
    normalized = await normalize_memory_with_gemini(
        phi_result.name,
        phi_result.relation,
        phi_result.context
    )
    
    return {
        "name": normalized.name,
        "relation": normalized.relation,
        "context": normalized.context,
        "success": any([normalized.name, normalized.relation, normalized.context]),
        "normalized": normalized.was_normalized,
        "source": "gemini_flash" if normalized.was_normalized else "phi_only"
    }


@app.post("/api/translate-summarize")
async def translate_and_summarize(request: TranslateRequest):
    """
    Translate and summarize non-English or mixed-language text.
    
    TRIGGER: When Whisper detects non-English or mixed language input.
    
    WHY GEMINI:
    - Phi-3 is optimized for English extraction only
    - Local translation is slow and unreliable
    - Gemini handles Hindi, Hinglish (Hindi+English mix), and other languages
    
    FLOW:
    Whisper (detects non-English) → This endpoint → Clean English summary
    """
    if not request.text or not request.text.strip():
        return {"summary": "", "success": False, "error": "Empty text"}
    
    print(f"[Gemini] Translating: {request.text[:50]}...")
    
    summary = await translate_and_summarize_with_gemini(
        request.text,
        request.source_language
    )
    
    if not summary:
        return {
            "summary": "",
            "success": False,
            "error": "Translation failed, Gemini unavailable"
        }
    
    return {
        "summary": summary,
        "success": True,
        "source": "gemini_flash",
        "original_language": request.source_language
    }


@app.get("/api/dashboard/insights")
async def get_dashboard_insights(days: int = 7, person_id: Optional[str] = None):
    """
    Generate intelligent insights for the dashboard view.
    
    ONLY for dashboard - NEVER in live AR overlay.
    
    WHY GEMINI:
    - Dashboard requires high-level reasoning that Phi-3 can't do
    - Aggregates patterns across multiple memories
    - Identifies common topics/themes
    - Generates natural language summaries
    - Creates caregiver-friendly explanations
    
    RETURNS:
    - Last interactions summary
    - Common topics discussed
    - Weekly/daily summaries
    - Caregiver notes
    """
    # Get memories from database
    all_people = get_all_people()
    
    # Filter by person_id if provided
    if person_id:
        all_people = [p for p in all_people if p.get("id") == person_id]
    
    if not all_people:
        return {
            "insights": {},
            "success": False,
            "error": "No memories found"
        }
    
    print(f"[Gemini] Generating dashboard insights for {len(all_people)} people")
    
    insights = await generate_dashboard_insights_with_gemini(all_people, days)
    
    return {
        "insights": {
            "last_interactions": insights.last_interactions,
            "common_topics": insights.common_topics,
            "weekly_summary": insights.weekly_summary,
            "caregiver_notes": insights.caregiver_notes,
            "generated_at": insights.generated_at
        },
        "success": True,
        "source": "gemini_flash",
        "people_analyzed": len(all_people)
    }


@app.post("/api/conversation/add-line")
async def add_conversation_line(session_id: str, text: str, person_name: Optional[str] = None):
    """
    Add a transcription line to the conversation buffer.
    
    This is used to track ongoing conversations for later summarization.
    The buffer is used by /api/summarize-conversation when triggered.
    
    Call this after each Whisper transcription in the frontend.
    """
    if session_id not in conversation_sessions:
        conversation_sessions[session_id] = ConversationSession()
    
    session = conversation_sessions[session_id]
    session.transcript_buffer.append(text)
    session.last_speech_time = time.time()
    session.is_active = True
    if person_name:
        session.person_name = person_name
    
    return {
        "status": "added",
        "buffer_size": len(session.transcript_buffer),
        "session_id": session_id
    }


@app.get("/api/conversation/get-buffer")
async def get_conversation_buffer(session_id: str):
    """
    Get the current conversation buffer for a session.
    """
    if session_id not in conversation_sessions:
        return {"transcript": [], "person_name": None}
    
    session = conversation_sessions[session_id]
    return {
        "transcript": session.transcript_buffer,
        "person_name": session.person_name,
        "last_speech_time": session.last_speech_time,
        "is_active": session.is_active
    }


@app.post("/api/conversation/clear")
async def clear_conversation_buffer(session_id: str):
    """
    Clear the conversation buffer for a session.
    Call this after summarization is complete.
    """
    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
    
    return {"status": "cleared", "session_id": session_id}


@app.post("/api/conversation/summarize-and-save")
async def summarize_and_save_conversation(session_id: str, person_id: Optional[str] = None):
    """
    Summarize the conversation buffer and optionally save to a person's context.
    
    FLOW:
    1. Get conversation buffer
    2. Call Gemini to summarize
    3. If person_id provided, update their context
    4. Clear the buffer
    
    This is the main integration point for end-of-conversation handling.
    """
    if session_id not in conversation_sessions:
        return {"success": False, "error": "Session not found"}
    
    session = conversation_sessions[session_id]
    
    if not session.transcript_buffer:
        return {"success": False, "error": "Empty conversation buffer"}
    
    # Generate summary with Gemini
    summary = await generate_conversation_summary_with_gemini(
        session.transcript_buffer,
        session.person_name
    )
    
    if not summary:
        summary = local_fallback_summary(session.transcript_buffer)
    
    # If person_id provided, update their context
    if person_id:
        person = get_person(person_id)
        if person:
            from database import update_person as db_update_person
            
            # Append summary to existing context
            existing_context = person.get("context", "")
            new_context = f"{existing_context}. {summary}" if existing_context else summary
            
            db_update_person(
                person_id=person_id,
                name=person.get("name", ""),
                relation=person.get("relation", ""),
                last_met="Just now",  # Update last_met
                context=new_context[:200]  # Limit context length
            )
            
            # Sync to Firebase
            updated_person = get_person(person_id)
            sync_person_to_firebase(updated_person)
            
            # Broadcast update
            await broadcast_to_all({
                "type": "person_updated",
                "data": updated_person
            })
    
    # Clear the buffer
    del conversation_sessions[session_id]
    
    return {
        "success": True,
        "summary": summary,
        "person_id": person_id,
        "source": "gemini_flash"
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

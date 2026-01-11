"""
Gemini Speech-to-Text + Extraction Service
==========================================

Replaces Whisper + Phi with a single Gemini call that:
1. Transcribes audio (any language: English, Hindi, Hinglish)
2. Extracts structured fields (name, relation, context)

This provides:
- Better multilingual support (Hindi, Hinglish work seamlessly)
- Single API call instead of Whisper → Phi pipeline
- Consistent quality across languages
"""

import base64
import json
import re
import tempfile
import os
from typing import Optional
from dataclasses import dataclass

import httpx

from config import GEMINI_API_KEY, GEMINI_MODEL

# Gemini API endpoint for audio
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Reusable HTTP client
_client: Optional[httpx.AsyncClient] = None


async def get_client() -> httpx.AsyncClient:
    """Get reusable async HTTP client."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=60.0)  # Longer timeout for audio
    return _client


@dataclass
class TranscriptionResult:
    """Result from Gemini transcription + extraction."""
    text: str  # Full transcription
    name: Optional[str] = None
    relation: Optional[str] = None
    context: Optional[str] = None
    language: str = "en"  # Detected language
    success: bool = True


async def transcribe_and_extract_with_gemini(
    audio_data: bytes,
    mime_type: str = "audio/webm"
) -> TranscriptionResult:
    """
    Transcribe audio and extract structured info using Gemini.
    
    Replaces: Whisper (transcription) + Phi-3 (extraction)
    
    Benefits:
    - Single API call instead of two
    - Native Hindi/Hinglish support
    - Better context understanding
    
    Args:
        audio_data: Raw audio bytes
        mime_type: Audio MIME type (audio/webm, audio/wav, audio/mp3)
        
    Returns:
        TranscriptionResult with transcription and extracted fields
    """
    if not GEMINI_API_KEY:
        print("[Gemini STT] API key not configured")
        return TranscriptionResult(text="", success=False)
    
    if not audio_data:
        return TranscriptionResult(text="", success=False)
    
    # Encode audio to base64
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    # Build prompt for transcription + extraction
    prompt = """Listen to this audio and do TWO things:

1. TRANSCRIBE: Write exactly what was said (in the original language)
2. EXTRACT: From the transcription, extract these fields if mentioned:
   - name: The name of the person being talked about
   - relation: Their relationship (Friend, Family, Doctor, Colleague, Neighbor, etc.)
   - context: A brief context/memory about them (max 10 words)

The audio may be in English, Hindi, or a mix (Hinglish). 
If Hindi, still extract the fields in ENGLISH.

Respond ONLY with this JSON format:
{
  "transcription": "exact words spoken",
  "language": "en" or "hi" or "hinglish",
  "name": "extracted name or null",
  "relation": "extracted relation or null",
  "context": "brief context or null"
}"""

    try:
        client = await get_client()
        
        response = await client.post(
            GEMINI_API_URL,
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 300,
                }
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"[Gemini STT] API error: {response.status_code} - {response.text[:200]}")
            return TranscriptionResult(text="", success=False)
        
        data = response.json()
        
        # Extract text from response
        candidates = data.get("candidates", [])
        if not candidates:
            print("[Gemini STT] No candidates in response")
            return TranscriptionResult(text="", success=False)
        
        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        if not parts:
            print("[Gemini STT] No parts in response")
            return TranscriptionResult(text="", success=False)
        
        raw_text = parts[0].get("text", "").strip()
        print(f"[Gemini STT] Raw response: {raw_text[:200]}")
        
        # Parse JSON from response
        json_match = re.search(r'\{[^{}]*\}', raw_text, re.DOTALL)
        if not json_match:
            # If no JSON, treat entire response as transcription
            return TranscriptionResult(
                text=raw_text,
                success=True
            )
        
        parsed = json.loads(json_match.group(0))
        
        # Extract fields
        transcription = parsed.get("transcription", raw_text)
        name = parsed.get("name")
        relation = parsed.get("relation")
        context = parsed.get("context")
        language = parsed.get("language", "en")
        
        # Clean null values
        if name in [None, "null", ""]: name = None
        if relation in [None, "null", ""]: relation = None
        if context in [None, "null", ""]: context = None
        
        # Normalize relation if present
        if relation:
            relation = relation.title()
        
        # Normalize name if present
        if name:
            name = name.title()
        
        result = TranscriptionResult(
            text=transcription,
            name=name,
            relation=relation,
            context=context,
            language=language,
            success=True
        )
        
        print(f"[Gemini STT] Result: text='{transcription[:50]}...', name={name}, relation={relation}")
        return result
        
    except json.JSONDecodeError as e:
        print(f"[Gemini STT] JSON parse error: {e}")
        return TranscriptionResult(text="", success=False)
    except Exception as e:
        print(f"[Gemini STT] Error: {e}")
        return TranscriptionResult(text="", success=False)


async def transcribe_only_with_gemini(
    audio_data: bytes,
    mime_type: str = "audio/webm"
) -> Optional[str]:
    """
    Simple transcription without extraction.
    For cases where you just need the text.
    """
    if not GEMINI_API_KEY:
        return None
    
    if not audio_data:
        return None
    
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    prompt = """Transcribe this audio exactly as spoken. 
The audio may be in English, Hindi, or mixed. 
Output ONLY the transcription, nothing else."""

    try:
        client = await get_client()
        
        response = await client.post(
            GEMINI_API_URL,
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 200,
                }
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                return parts[0].get("text", "").strip()
        
        return None
        
    except Exception as e:
        print(f"[Gemini STT] Error: {e}")
        return None

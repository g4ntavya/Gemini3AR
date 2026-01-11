"""
Gemini Speech-to-Text + Extraction Service
==========================================

Uses the official Google GenAI SDK with gemini-3-flash-preview model.

Features:
- Transcribes audio (any language: English, Hindi, Hinglish)
- Extracts structured fields (name, relation, context) in one call
"""

import base64
import json
import re
import os
from typing import Optional
from dataclasses import dataclass

from google import genai

from config import GEMINI_API_KEY, GEMINI_MODEL

# Initialize the GenAI client
_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    """Get the GenAI client instance."""
    global _client
    if _client is None:
        # Set API key via environment variable for the client
        os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
        _client = genai.Client()
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
    Transcribe audio and extract structured info using Gemini 3 Flash.
    
    Uses the official Google GenAI SDK.
    
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
        client = get_client()
        
        # Create the content with audio
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_base64
                            }
                        }
                    ]
                }
            ]
        )
        
        raw_text = response.text.strip()
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
    """
    if not GEMINI_API_KEY or not audio_data:
        return None
    
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    prompt = """Transcribe this audio exactly as spoken. 
The audio may be in English, Hindi, or mixed. 
Output ONLY the transcription, nothing else."""

    try:
        client = get_client()
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_base64
                            }
                        }
                    ]
                }
            ]
        )
        
        return response.text.strip()
        
    except Exception as e:
        print(f"[Gemini STT] Error: {e}")
        return None

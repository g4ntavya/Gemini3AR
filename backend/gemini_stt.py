"""
Gemini Speech-to-Text + Extraction Service
"""

import base64
import json
import re
from typing import Optional
from dataclasses import dataclass

import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_MODEL

# Configure the API
genai.configure(api_key=GEMINI_API_KEY)


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
    Transcribe audio and extract structured info using Gemini Flash.
    """
    if not GEMINI_API_KEY:
        print("[Gemini STT] API key not configured")
        return TranscriptionResult(text="", success=False)
    
    if not audio_data:
        return TranscriptionResult(text="", success=False)
    
    # Build prompt for transcription + extraction
    prompt = """Listen to this audio carefully and do TWO things:

1. TRANSCRIBE: Write EXACTLY what was said. 
   - If Hindi/Hinglish, write in ROMAN LETTERS (not Devanagari)
   - Example: "Yeh mera bhai / @dost Rahul hai" NOT "यह मेरा भाई राहुल है"
   - Preserve the original language mixing (English+Hindi words together)

2. EXTRACT: From the transcription, find these fields if mentioned:
   - name: The person's name being talked about (proper noun)
   - relation: Their relationship (Friend, Family, Brother, Sister, Doctor, Colleague, Neighbor, etc.)
   - context: A brief memory/fact about them (max 10 words)

EXAMPLES:
- Audio: "Yeh mera college friend Arjun hai" → name="Arjun", relation="Friend", context="college friend"
- Audio: "This is my sister Priya, she lives in Delhi" → name="Priya", relation="Sister", context="lives in Delhi"
- Audio: "Amit bhai doctor hai" → name="Amit", relation="Brother", context="is a doctor"

IMPORTANT: 
- Transcribe Hindi words phonetically in Roman script
- Extract fields in ENGLISH even if audio is in Hindi

Respond ONLY with this JSON (no markdown):
{
  "transcription": "exact words in romanized form",
  "language": "en" or "hi" or "hinglish",
  "name": "extracted name or null",
  "relation": "extracted relation or null",
  "context": "brief context or null"
}"""

    try:
        # Create model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Create audio part
        audio_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(audio_data).decode('utf-8')
            }
        }
        
        # Generate response
        response = model.generate_content([prompt, audio_part])
        
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
    
    prompt = """Transcribe this audio exactly as spoken. 
The audio may be in English, Hindi, or mixed. 
Output ONLY the transcription, nothing else."""

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        audio_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(audio_data).decode('utf-8')
            }
        }
        
        response = model.generate_content([prompt, audio_part])
        return response.text.strip()
        
    except Exception as e:
        print(f"[Gemini STT] Error: {e}")
        return None

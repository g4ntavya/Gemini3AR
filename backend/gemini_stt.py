"""
Gemini Speech-to-Text + Extraction Service
Uses shared gemini_client for non-blocking, singleton model calls.
"""

import base64
import json
import re
from typing import Optional
from dataclasses import dataclass

from gemini_client import call_gemini
from regions import build_language_hint, DEFAULT_REGION_CODE


@dataclass
class TranscriptionResult:
    """Result from Gemini transcription + extraction."""
    text: str  # Full transcription
    name: Optional[str] = None
    relation: Optional[str] = None
    context: Optional[str] = None
    language: str = "en"  # Detected language
    success: bool = True


# ── Base prompt (region hint is prepended dynamically) ──

_STT_EXTRACT_PROMPT_BASE = """Listen to this audio and respond with JSON only (no markdown).

Tasks:
1. TRANSCRIBE exactly what was said. For non-Latin scripts (Hindi, Arabic, Urdu, etc.) use Roman/Latin transliteration, not native scripts.
2. EXTRACT if mentioned: name (proper noun), relation (Friend/Family/Brother/Sister/Doctor/Colleague/Neighbor/Other), context (≤10 words, English).

Examples:
- "Yeh mera college friend Arjun hai" → {"transcription":"Yeh mera college friend Arjun hai","language":"hinglish","name":"Arjun","relation":"Friend","context":"college friend"}
- "This is my sister Priya, she lives in Delhi" → {"transcription":"This is my sister Priya, she lives in Delhi","language":"en","name":"Priya","relation":"Sister","context":"lives in Delhi"}
- "Amit bhai doctor hai" → {"transcription":"Amit bhai doctor hai","language":"hinglish","name":"Amit","relation":"Brother","context":"is a doctor"}

JSON format:
{"transcription":"...","language":"detected language code","name":"extracted or null","relation":"extracted or null","context":"extracted or null"}"""

_STT_ONLY_PROMPT_BASE = """Transcribe this audio exactly as spoken. For non-Latin scripts use Roman/Latin transliteration. Output ONLY the transcription text, nothing else."""


def _build_stt_extract_prompt(region_code: Optional[str] = None) -> str:
    """Build the STT + extraction prompt with region-specific language hints."""
    if region_code:
        language_hint = build_language_hint(region_code)
        return f"{language_hint}\n\n{_STT_EXTRACT_PROMPT_BASE}"
    return _STT_EXTRACT_PROMPT_BASE


def _build_stt_only_prompt(region_code: Optional[str] = None) -> str:
    """Build the simple STT prompt with region-specific language hints."""
    if region_code:
        language_hint = build_language_hint(region_code)
        return f"{language_hint}\n\n{_STT_ONLY_PROMPT_BASE}"
    return _STT_ONLY_PROMPT_BASE


def _clean(val):
    """Return None for null-ish values."""
    return None if val in (None, "null", "") else val


def _parse_stt_response(raw: str) -> TranscriptionResult:
    """Parse JSON from Gemini STT response."""
    # Try direct JSON parse first (fast path)
    parsed = None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: extract JSON object from surrounding text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    # If JSON parsing failed entirely, try to salvage the transcription text
    if parsed is None:
        # Try to extract partial transcription from truncated JSON
        trans_match = re.search(r'"transcription"\s*:\s*"([^"]+)', raw)
        if trans_match:
            return TranscriptionResult(text=trans_match.group(1).strip(), success=True)
        # Last resort: if it looks like JSON, don't show it raw
        if raw.lstrip().startswith('{'):
            return TranscriptionResult(text='', success=False)
        return TranscriptionResult(text=raw, success=True)

    transcription = parsed.get("transcription", raw)
    name = _clean(parsed.get("name"))
    relation = _clean(parsed.get("relation"))
    context = _clean(parsed.get("context"))
    language = parsed.get("language", "en")

    return TranscriptionResult(
        text=transcription,
        name=name.title() if name else None,
        relation=relation.title() if relation else None,
        context=context,
        language=language,
        success=True,
    )


async def transcribe_and_extract_with_gemini(
    audio_data: bytes,
    mime_type: str = "audio/webm",
    region_code: Optional[str] = None,
) -> TranscriptionResult:
    """
    Transcribe audio and extract structured info using Gemini Flash.
    Single API call — non-blocking, with timeout.
    
    Args:
        audio_data: Raw audio bytes
        mime_type: Audio MIME type
        region_code: ISO 3166-1 alpha-2 country code for language/accent hints
    """
    if not audio_data:
        return TranscriptionResult(text="", success=False)

    audio_part = {
        "inline_data": {
            "mime_type": mime_type,
            "data": base64.b64encode(audio_data).decode("utf-8"),
        }
    }

    # Build prompt with region-specific language hints
    prompt = _build_stt_extract_prompt(region_code)
    
    if region_code:
        print(f"[Gemini STT] Using region: {region_code}")
    
    raw = await call_gemini([prompt, audio_part], timeout=12.0)

    if not raw:
        return TranscriptionResult(text="", success=False)

    print(f"[Gemini STT] Raw response: {raw[:200]}")
    result = _parse_stt_response(raw)
    print(f"[Gemini STT] text='{result.text[:50]}', name={result.name}, relation={result.relation}")
    return result


async def transcribe_only_with_gemini(
    audio_data: bytes,
    mime_type: str = "audio/webm",
    region_code: Optional[str] = None,
) -> Optional[str]:
    """
    Simple transcription without extraction.
    
    Args:
        audio_data: Raw audio bytes
        mime_type: Audio MIME type
        region_code: ISO 3166-1 alpha-2 country code for language/accent hints
    """
    if not audio_data:
        return None

    audio_part = {
        "inline_data": {
            "mime_type": mime_type,
            "data": base64.b64encode(audio_data).decode("utf-8"),
        }
    }

    # Build prompt with region-specific language hints
    prompt = _build_stt_only_prompt(region_code)

    return await call_gemini([prompt, audio_part], timeout=10.0)

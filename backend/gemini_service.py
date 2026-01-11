"""
Gemini Service for RemindAR
===========================

Uses the official Google GenAI SDK with gemini-3-flash-preview model.

Features:
1. Conversation Memory Summarization
2. Memory Normalization & Cleanup
3. Multilingual Handling
4. Dashboard Intelligence
"""

import json
import re
import time
import os
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime

from google import genai

from config import GEMINI_API_KEY, GEMINI_MODEL

# Initialize the GenAI client
_client: Optional[genai.Client] = None

# Cache for avoiding repeat API calls
_summary_cache: dict[str, tuple[str, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_client() -> genai.Client:
    """Get the GenAI client instance."""
    global _client
    if _client is None:
        os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
        _client = genai.Client()
    return _client


def _check_gemini_available() -> bool:
    """Check if Gemini API key is configured."""
    return bool(GEMINI_API_KEY)


def _call_gemini_sync(prompt: str, max_tokens: int = 150) -> Optional[str]:
    """
    Make a synchronous call to Gemini.
    """
    if not _check_gemini_available():
        print("[Gemini] API key not configured, skipping")
        return None
    
    try:
        client = get_client()
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        
        return response.text.strip()
        
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return None


async def _call_gemini(prompt: str, max_tokens: int = 150) -> Optional[str]:
    """
    Make a call to Gemini (async wrapper around sync call).
    """
    return _call_gemini_sync(prompt, max_tokens)


# ============================================================================
# 1. CONVERSATION MEMORY SUMMARIZATION
# ============================================================================

async def generate_conversation_summary_with_gemini(
    transcript_buffer: list[str],
    person_name: Optional[str] = None
) -> Optional[str]:

    if not transcript_buffer:
        return None
    
    # Check cache
    cache_key = "||".join(transcript_buffer)
    if cache_key in _summary_cache:
        cached_result, cached_time = _summary_cache[cache_key]
        if time.time() - cached_time < CACHE_TTL_SECONDS:
            print("[Gemini] Using cached summary")
            return cached_result
    
    # Build prompt
    transcript_text = "\n".join(f"- {line}" for line in transcript_buffer)
    
    prompt = f"""Convert this conversation transcript into ONE short, clean English memory.

RULES:
- Maximum 15 words
- Remove filler words (um, uh, like, you know)
- Be emotionally neutral
- Preserve key facts only
- If mixed languages, output in English

TRANSCRIPT:
{transcript_text}

{f"Person being talked to: {person_name}" if person_name else ""}

MEMORY SUMMARY (one line only):"""

    result = await _call_gemini(prompt, max_tokens=50)
    
    if result:
        # Clean up the result
        result = result.strip().strip('"').strip("'")
        # Remove any "Memory:" or similar prefix
        result = re.sub(r'^(memory|summary|context):\s*', '', result, flags=re.IGNORECASE)
        # Cache it
        _summary_cache[cache_key] = (result, time.time())
        print(f"[Gemini] Generated summary: {result}")
    
    return result


# ============================================================================
# 2. MEMORY NORMALIZATION & CLEANUP
# ============================================================================

@dataclass
class NormalizedMemory:
    """Normalized memory fields after Gemini cleanup."""
    name: str
    relation: str
    context: str
    was_normalized: bool = False


async def normalize_memory_with_gemini(
    name: Optional[str],
    relation: Optional[str],
    context: Optional[str]
) -> NormalizedMemory:
    """
    Normalize and clean up memory fields.
    """
    # If all fields are empty, return as-is
    if not any([name, relation, context]):
        return NormalizedMemory(
            name=name or "",
            relation=relation or "",
            context=context or "",
            was_normalized=False
        )
    
    # Build prompt
    prompt = f"""Normalize these memory fields. Output JSON only.

INPUT:
- name: {name or "unknown"}
- relation: {relation or "unknown"}
- context: {context or "none"}

RULES:
1. Capitalize names properly (e.g., "aditya" → "Aditya")
2. Use standard relation labels: Friend, Family, Doctor, Nurse, Caregiver, Neighbor, Colleague, Teacher, Other
3. Shorten context to ≤8 words, keep essential info only
4. Remove filler words and ambiguity

OUTPUT FORMAT (JSON only):
{{"name": "...", "relation": "...", "context": "..."}}"""

    result = await _call_gemini(prompt, max_tokens=80)
    
    if result:
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[^{}]*\}', result)
            if json_match:
                data = json.loads(json_match.group(0))
                return NormalizedMemory(
                    name=data.get("name", name or ""),
                    relation=data.get("relation", relation or ""),
                    context=data.get("context", context or ""),
                    was_normalized=True
                )
        except (json.JSONDecodeError, Exception) as e:
            print(f"[Gemini] Normalization parse error: {e}")
    
    # Fallback: return original values with basic cleanup
    return NormalizedMemory(
        name=(name or "").title(),
        relation=(relation or "").title(),
        context=(context or "")[:50],
        was_normalized=False
    )


# ============================================================================
# 3. MULTILINGUAL HANDLING
# ============================================================================

async def translate_and_summarize_with_gemini(
    transcript: str,
    source_language: Optional[str] = None
) -> Optional[str]:
    """
    Translate and summarize non-English or mixed-language transcripts.
    """
    if not transcript or not transcript.strip():
        return None
    
    prompt = f"""Translate and summarize this transcript into clean English.

TRANSCRIPT (may be Hindi, Hinglish, or mixed language):
"{transcript}"

{f"Detected language: {source_language}" if source_language else ""}

RULES:
- Output ONE short English sentence (≤15 words)
- Capture the main meaning/context
- Remove filler words
- Be natural and clear

ENGLISH SUMMARY:"""

    result = await _call_gemini(prompt, max_tokens=50)
    
    if result:
        result = result.strip().strip('"').strip("'")
        print(f"[Gemini] Translated summary: {result}")
    
    return result


# ============================================================================
# 4. DASHBOARD INTELLIGENCE
# ============================================================================

@dataclass
class DashboardInsights:
    """Insights generated for the dashboard view."""
    last_interactions: list[str] = field(default_factory=list)
    common_topics: list[str] = field(default_factory=list)
    weekly_summary: str = ""
    caregiver_notes: str = ""
    generated_at: str = ""


async def generate_dashboard_insights_with_gemini(
    memories: list[dict],
    days: int = 7
) -> DashboardInsights:
    """
    Generate intelligent insights for the dashboard view.
    """
    if not memories:
        return DashboardInsights(generated_at=datetime.now().isoformat())
    
    # Prepare memory data for prompt
    memory_lines = []
    for m in memories[:20]:  # Limit to 20 most recent
        name = m.get("name", "Unknown")
        relation = m.get("relation", "")
        context = m.get("context", "")
        last_met = m.get("last_met", "")
        memory_lines.append(f"- {name} ({relation}): {context} [Last: {last_met}]")
    
    memories_text = "\n".join(memory_lines)
    
    prompt = f"""Analyze these memory entries and generate insights for a caregiver dashboard.

MEMORIES (last {days} days):
{memories_text}

Generate insights in this JSON format:
{{
  "last_interactions": ["Person A was seen yesterday", "Person B visited last week"],
  "common_topics": ["health checkups", "family visits", "medication"],
  "weekly_summary": "Brief 1-2 sentence overview of the week's interactions",
  "caregiver_notes": "Any important observations or patterns for caregivers"
}}

OUTPUT (JSON only):"""

    result = await _call_gemini(prompt, max_tokens=300)
    
    insights = DashboardInsights(generated_at=datetime.now().isoformat())
    
    if result:
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                insights.last_interactions = data.get("last_interactions", [])
                insights.common_topics = data.get("common_topics", [])
                insights.weekly_summary = data.get("weekly_summary", "")
                insights.caregiver_notes = data.get("caregiver_notes", "")
                print(f"[Gemini] Generated dashboard insights")
        except (json.JSONDecodeError, Exception) as e:
            print(f"[Gemini] Dashboard insights parse error: {e}")
    
    return insights


# ============================================================================
# LOCAL FALLBACK (when Gemini is unavailable)
# ============================================================================

def local_fallback_summary(transcript_buffer: list[str]) -> str:
    """
    Simple local fallback when Gemini API is unavailable.
    """
    if not transcript_buffer:
        return ""
    
    # Take last transcript, truncate to 50 chars
    last_line = transcript_buffer[-1]
    if len(last_line) > 50:
        last_line = last_line[:47] + "..."
    
    return last_line


def local_fallback_normalize(
    name: Optional[str],
    relation: Optional[str],
    context: Optional[str]
) -> NormalizedMemory:
    """
    Basic local normalization when Gemini is unavailable.
    """
    return NormalizedMemory(
        name=(name or "").title(),
        relation=(relation or "").title(),
        context=(context or "")[:50],
        was_normalized=False
    )

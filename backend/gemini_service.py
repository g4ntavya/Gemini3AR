"""
Gemini Service for RemindAR
===========================

Uses shared gemini_client for non-blocking, singleton model calls.
Handles summarization, normalization, translation, and dashboard insights.
"""

import json
import re
import time
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime

from gemini_client import call_gemini


# Cache for avoiding repeat API calls
_summary_cache: dict[str, tuple[str, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


# ============================================================================
# 1. CONVERSATION MEMORY SUMMARIZATION
# ============================================================================

async def generate_conversation_summary_with_gemini(
    transcript_buffer: list[str],
    person_name: Optional[str] = None,
) -> Optional[str]:
    if not transcript_buffer:
        return None

    # Check cache
    cache_key = "||".join(transcript_buffer)
    cached = _summary_cache.get(cache_key)
    if cached and time.time() - cached[1] < CACHE_TTL_SECONDS:
        print("[Gemini] Using cached summary")
        return cached[0]

    transcript_text = "\n".join(f"- {line}" for line in transcript_buffer)
    person_line = f"\nPerson being talked to: {person_name}" if person_name else ""

    prompt = f"""Convert this transcript into ONE short English memory sentence (max 15 words).
Remove filler words. Preserve key facts only.{person_line}

Transcript:
{transcript_text}

Memory:"""

    result = await call_gemini(prompt)

    if result:
        result = result.strip().strip('"').strip("'")
        result = re.sub(r'^(memory|summary|context):\s*', '', result, flags=re.IGNORECASE)
        _summary_cache[cache_key] = (result, time.time())
        # Evict old entries
        if len(_summary_cache) > 200:
            oldest = next(iter(_summary_cache))
            del _summary_cache[oldest]
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


_STANDARD_RELATIONS = {
    "friend", "family", "brother", "sister", "doctor", "nurse",
    "caregiver", "neighbor", "colleague", "teacher", "other",
}


def _local_normalize(
    name: Optional[str],
    relation: Optional[str],
    context: Optional[str],
) -> NormalizedMemory:
    """Fast local cleanup — no API call needed for basic capitalization."""
    norm_name = (name or "").strip().title()
    norm_relation = (relation or "").strip().title()
    norm_context = (context or "").strip()[:60]
    return NormalizedMemory(
        name=norm_name,
        relation=norm_relation,
        context=norm_context,
        was_normalized=False,
    )


async def normalize_memory_with_gemini(
    name: Optional[str],
    relation: Optional[str],
    context: Optional[str],
) -> NormalizedMemory:
    """
    Normalize and clean up memory fields.
    Uses local logic for trivial cases, Gemini only when context needs semantic cleanup.
    """
    if not any([name, relation, context]):
        return NormalizedMemory(name="", relation="", context="", was_normalized=False)

    # Decide whether we actually need Gemini
    needs_gemini = False
    if context:
        words = context.split()
        filler = {"um", "uh", "like", "you", "know", "so", "basically"}
        needs_gemini = len(words) > 10 or bool(filler & {w.lower() for w in words})

    if not needs_gemini:
        return _local_normalize(name, relation, context)

    prompt = f"""Normalize these memory fields. JSON only, no markdown.
Input: name="{name or 'unknown'}", relation="{relation or 'unknown'}", context="{context or 'none'}"
Rules: capitalize name, use standard relation (Friend/Family/Brother/Sister/Doctor/Nurse/Caregiver/Neighbor/Colleague/Teacher/Other), shorten context to ≤8 words.
{{"name":"...","relation":"...","context":"..."}}"""

    raw = await call_gemini(prompt)

    if raw:
        try:
            match = re.search(r'\{[^{}]+\}', raw)
            if match:
                data = json.loads(match.group(0))
                return NormalizedMemory(
                    name=data.get("name", name or ""),
                    relation=data.get("relation", relation or ""),
                    context=data.get("context", context or ""),
                    was_normalized=True,
                )
        except (json.JSONDecodeError, Exception) as e:
            print(f"[Gemini] Normalization parse error: {e}")

    return _local_normalize(name, relation, context)


# ============================================================================
# 3. MULTILINGUAL HANDLING
# ============================================================================

async def translate_and_summarize_with_gemini(
    transcript: str,
    source_language: Optional[str] = None,
) -> Optional[str]:
    """Translate and summarize non-English or mixed-language transcripts."""
    if not transcript or not transcript.strip():
        return None

    lang_hint = f"\nDetected language: {source_language}" if source_language else ""

    prompt = f"""Translate and summarize into ONE short English sentence (≤15 words). No filler words.{lang_hint}

Transcript: "{transcript}"

English summary:"""

    result = await call_gemini(prompt)

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
    days: int = 7,
) -> DashboardInsights:
    """Generate intelligent insights for the dashboard view."""
    if not memories:
        return DashboardInsights(generated_at=datetime.now().isoformat())

    memory_lines = [
        f"- {m.get('name', '?')} ({m.get('relation', '')}): {m.get('context', '')} [Last: {m.get('last_met', '')}]"
        for m in memories[:20]
    ]

    prompt = f"""Analyze these {days}-day memories. JSON only, no markdown.

{chr(10).join(memory_lines)}

{{"last_interactions":["..."], "common_topics":["..."], "weekly_summary":"...", "caregiver_notes":"..."}}"""

    raw = await call_gemini(prompt)
    insights = DashboardInsights(generated_at=datetime.now().isoformat())

    if raw:
        try:
            # Use greedy regex with DOTALL to capture nested arrays/objects
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                insights.last_interactions = data.get("last_interactions", [])
                insights.common_topics = data.get("common_topics", [])
                insights.weekly_summary = data.get("weekly_summary", "")
                insights.caregiver_notes = data.get("caregiver_notes", "")
                print("[Gemini] Generated dashboard insights")
        except (json.JSONDecodeError, Exception) as e:
            print(f"[Gemini] Dashboard insights parse error: {e}")

    return insights


# ============================================================================
# LOCAL FALLBACK (when Gemini is unavailable)
# ============================================================================

def local_fallback_summary(transcript_buffer: list[str]) -> str:
    """Simple local fallback when Gemini API is unavailable."""
    if not transcript_buffer:
        return ""
    last_line = transcript_buffer[-1]
    return last_line[:47] + "..." if len(last_line) > 50 else last_line


def local_fallback_normalize(
    name: Optional[str],
    relation: Optional[str],
    context: Optional[str],
) -> NormalizedMemory:
    """Basic local normalization when Gemini is unavailable."""
    return _local_normalize(name, relation, context)

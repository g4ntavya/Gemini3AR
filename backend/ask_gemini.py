"""
Ask Gemini - Context Memory Query Service

Takes voice query, searches people database for context matches,
generates natural language response using Gemini.

IMPORTANT: Gemini is strictly scoped to the people database.
It must NEVER answer general knowledge, weather, trivia, etc.
"""

import json
import base64
from typing import Dict, Any

from database import get_all_people_lightweight
from gemini_client import call_gemini


async def process_gemini_query(audio_bytes: bytes, user_id: str = "") -> Dict[str, Any]:
    """
    Process a voice query about people context.

    Single Gemini call: transcribes audio AND searches people in one shot.
    Anti-hallucination: prompt explicitly restricts answers to database content only.

    Returns:
        {
            "text": "Natural language response",
            "matches": [{"person": {...}, "relevance": "..."}],
            "query": "Original transcribed query"
        }
    """
    try:
        people = get_all_people_lightweight(user_id=user_id)

        if not people:
            return {
                "text": "You haven't registered any people yet. Use the camera to add people first.",
                "matches": [],
                "query": "",
            }

        # Build compact people context for the prompt
        # Truncate context to prevent prompt injection / token bloat
        people_context = [
            {
                "id": p.get("id", ""),
                "name": p.get("name", "?")[:50],
                "relation": p.get("relation", "")[:30],
                "context": p.get("context", "")[:120],
                "last_met": p.get("last_met", "")[:30],
            }
            for p in people
        ]

        # ── Single prompt: transcribe + search + respond ──
        # Anti-hallucination guardrail is embedded directly in the system instruction.
        prompt = f"""You are a memory assistant for a person who has difficulty remembering faces.
You will hear a voice query. Do these steps:

1. TRANSCRIBE what was said (Hindi/Hinglish → Roman letters, not Devanagari).
2. SEARCH the people database below for relevant matches.
3. RESPOND with a friendly, helpful answer BASED ONLY ON THE DATABASE.

STRICT RULES:
- You may ONLY reference information present in the database below.
- If the query is unrelated to the people database (e.g. weather, news, math, trivia), respond: "I can only help you recall people you've met. Try asking about a person!"
- NEVER invent or hallucinate information not in the database.
- If no people match, say so politely.
- Keep response under 3 sentences.

DATABASE:
{json.dumps(people_context, indent=2)}

Respond with JSON only (no markdown):
{{"query":"transcribed text","response_text":"your answer","matched_people":[{{"id":"person_id","relevance":"why relevant"}}]}}"""

        audio_part = {
            "inline_data": {
                "mime_type": "audio/webm",
                "data": base64.b64encode(audio_bytes).decode("utf-8"),
            }
        }

        raw = await call_gemini([prompt, audio_part], timeout=15.0)

        if not raw:
            return {
                "text": "Sorry, I couldn't process your query right now. Please try again.",
                "matches": [],
                "query": "",
            }

        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[-1]  # skip first ```json line
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError:
            # Fallback: show raw text
            return {"text": raw, "matches": [], "query": ""}

        query = parsed.get("query", "")
        print(f"[AskGemini] Query: {query}")

        # Build matches with person data (lightweight — no face_image)
        people_map = {p["id"]: p for p in people}
        matches = [
            {"person": people_map[m["id"]], "relevance": m.get("relevance", "")}
            for m in parsed.get("matched_people", [])
            if m.get("id") in people_map
        ]

        return {
            "text": parsed.get("response_text", "I couldn't find any relevant information."),
            "matches": matches,
            "query": query,
        }

    except Exception as e:
        print(f"[AskGemini] Error: {e}")
        return {
            "text": f"Sorry, something went wrong: {str(e)}",
            "matches": [],
            "query": "",
        }

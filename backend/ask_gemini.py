"""
Ask Gemini - Context Memory Query Service

Takes voice query, searches people database for context matches,
generates natural language response using Gemini.
"""

import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL
from database import get_all_people
from typing import List, Dict, Any
import json
import base64
import io

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)


async def process_gemini_query(audio_bytes: bytes) -> Dict[str, Any]:
    """
    Process a voice query about people context.
    
    Flow:
    1. Transcribe audio with Gemini
    2. Search people database for matches
    3. Generate natural response
    
    Returns:
        {
            "text": "Natural language response",
            "matches": [{"person": {...}, "relevance": "..."}],
            "query": "Original transcribed query"
        }
    """
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Step 1: Transcribe the audio query
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        transcribe_prompt = """
        Transcribe this audio query. The user is asking about people they know.
        
        IMPORTANT:
        - If speaking Hindi/Hinglish, write in ROMAN LETTERS (not Devanagari)
        - Example: "Mera bhai kaun hai?" NOT "मेरा भाई कौन है?"
        - Preserve mixed Hindi+English words naturally
        
        Return ONLY the transcribed text, nothing else.
        """
        
        transcribe_response = model.generate_content([
            transcribe_prompt,
            {
                "mime_type": "audio/webm",
                "data": audio_base64
            }
        ])
        
        query = transcribe_response.text.strip()
        print(f"[AskGemini] Query: {query}")
        
        # Step 2: Get all people from database
        people = get_all_people()
        
        if not people:
            return {
                "text": "You haven't registered any people yet. Use the camera to add people first.",
                "matches": [],
                "query": query
            }
        
        # Step 3: Create context for Gemini to search
        people_context = []
        for person in people:
            people_context.append({
                "id": person.get("id", ""),
                "name": person.get("name", "Unknown"),
                "relation": person.get("relation", ""),
                "context": person.get("context", ""),
                "last_met": person.get("last_met", "")
            })
        
        # Step 4: Ask Gemini to find relevant matches
        search_prompt = f"""
        The user asked: "{query}"
        
        Here are all the people they know:
        {json.dumps(people_context, indent=2)}
        
        Based on the user's query, identify which people are relevant and why.
        
        Respond in this exact JSON format:
        {{
            "response_text": "A natural, friendly response answering their question",
            "matched_people": [
                {{
                    "id": "person_id",
                    "relevance": "Why this person is relevant to the query"
                }}
            ]
        }}
        
        If no people match the query, explain that politely.
        Keep the response conversational and helpful.
        """
        
        search_response = model.generate_content(search_prompt)
        response_text = search_response.text.strip()
        
        # Clean up JSON response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        try:
            parsed = json.loads(response_text.strip())
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "text": response_text,
                "matches": [],
                "query": query
            }
        
        # Build matches with full person data
        matches = []
        for match in parsed.get("matched_people", []):
            person_id = match.get("id", "")
            relevance = match.get("relevance", "")
            
            # Find the full person data
            for person in people:
                if person.get("id") == person_id:
                    matches.append({
                        "person": person,
                        "relevance": relevance
                    })
                    break
        
        return {
            "text": parsed.get("response_text", "I couldn't find any relevant information."),
            "matches": matches,
            "query": query
        }
        
    except Exception as e:
        print(f"[AskGemini] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "text": f"Sorry, I encountered an error: {str(e)}",
            "matches": [],
            "query": ""
        }

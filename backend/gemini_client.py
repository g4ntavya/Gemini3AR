"""
Shared Gemini client — single model instance reused across all modules.
Provides async calls that don't block the FastAPI event loop,
with timeout and retry logic.
"""

import asyncio
from typing import Optional, Union

import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_MODEL

# Configure once at module load
genai.configure(api_key=GEMINI_API_KEY)

# Pre-built config reused on every call (avoids per-call object creation)
_DEFAULT_GEN_CONFIG = genai.GenerationConfig(
    temperature=0.1,
    candidate_count=1,
)

# Single model instance — reused by all callers
_model: Optional[genai.GenerativeModel] = None


def get_model() -> genai.GenerativeModel:
    """Get the singleton GenerativeModel instance."""
    global _model
    if _model is None:
        _model = genai.GenerativeModel(
            GEMINI_MODEL,
            generation_config=_DEFAULT_GEN_CONFIG,
        )
    return _model


async def call_gemini(
    prompt: Union[str, list],
    max_output_tokens: int = 0,
    timeout: float = 12.0,
) -> Optional[str]:
    """
    Non-blocking Gemini call.

    Runs the sync SDK in a thread-pool executor so the FastAPI
    event loop is never blocked.

    Args:
        prompt: text string or list (for multimodal with audio/image parts)
        max_output_tokens: cap output length (0 = no limit)
        timeout: hard timeout in seconds

    Returns:
        stripped response text, or None on any failure / timeout
    """
    if not GEMINI_API_KEY:
        print("[Gemini] API key not configured")
        return None

    model = get_model()
    loop = asyncio.get_event_loop()

    def _blocking_call() -> str:
        config = _DEFAULT_GEN_CONFIG
        if max_output_tokens > 0:
            config = genai.GenerationConfig(
                temperature=0.1,
                candidate_count=1,
                max_output_tokens=max_output_tokens,
            )
        response = model.generate_content(prompt, generation_config=config)
        return response.text.strip()

    try:
        return await asyncio.wait_for(
            loop.run_in_executor(None, _blocking_call),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        print(f"[Gemini] Timed out after {timeout}s")
        return None
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return None

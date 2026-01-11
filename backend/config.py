"""
Configuration module for RemindAR backend.
Handles API keys and environment variables.
"""

import os
from pathlib import Path

# Load from .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Gemini API Key - loaded from .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Gemini model to use - Gemini 3 Flash (latest)
GEMINI_MODEL = "gemini-3-flash-preview"

# Ollama configuration (kept as fallback)
OLLAMA_URL = "http://localhost:11434/api/generate"
PHI_MODEL = "phi3:mini"

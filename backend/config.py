"""
Configuration module for RemindAR backend.
Handles API keys and environment variables.
"""

import os
from pathlib import Path

# Try to load from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# Gemini Flash API Configuration
# Get your API key from: https://aistudio.google.com/app/apikey
# Set via environment variable or .env file (preferred for production)
# The default key below is for development only
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDP13kXLZTCie5zgSN5cZMJfwK6QPRwiqI")

# Gemini model to use (Flash for speed)
GEMINI_MODEL = "gemini-2.0-flash"

# Ollama configuration (existing)
OLLAMA_URL = "http://localhost:11434/api/generate"
PHI_MODEL = "phi3:mini"

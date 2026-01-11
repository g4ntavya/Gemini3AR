# RemindAR

A real-time face recognition system with AR overlays, designed to help people with memory challenges recognize and remember the people in their lives.

---

## Overview

RemindAR uses your webcam to detect faces, recognize identities, and display contextual information as floating labels. Think of it as a prototype for smart glasses that could help someone with dementia remember their family, caregivers, and friends.

**How it works:**
- Face detection runs in the browser using MediaPipe
- Face recognition uses InsightFace embeddings on the backend
- **Gemini 3 Flash** for voice input transcription and field extraction
- Native **Hindi/Hinglish** support for multilingual users
- Data syncs between local SQLite and Firebase Firestore

---

## Getting Started

### Requirements

- Python 3.9+
- Node.js 18+
- A webcam
- Gemini API key (get from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your-api-key-here" > .env

# Start the server
python main.py
```

### 2. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Open `http://localhost:5173` and allow camera access.

---

## Features

**Face Detection**  
MediaPipe runs in-browser for fast detection.

**Face Recognition**  
InsightFace embeddings matched using cosine similarity.

**Voice Registration (Powered by Gemini 3 Flash)**  
Speak naturally: "That's Aditya, my friend, we met for coffee"  
Gemini transcribes + extracts structured data in ONE call.  
Supports English, Hindi, and Hinglish! 🇮🇳

**Hybrid Storage**  
Firestore for cloud sync, SQLite for local reads, in-memory cache for speed.

---

## Registering Faces

1. Click "Add this person" on an unknown face
2. Click "Speak" and say something like: "That's Sarah, my doctor, she prescribed medication"
3. Form auto-fills with extracted info (name, relation, context)
4. Click Save

---

## Architecture

```
Frontend (React + TypeScript)
├── MediaPipe face detection
├── WebSocket for recognition
└── AR overlay with CSS

Backend (FastAPI + Python)
├── InsightFace recognition
├── Gemini 3 Flash (transcription + extraction)
└── SQLite + Firebase storage
```

### Gemini Integration

```
User speaks → Gemini 3 Flash → { transcription, name, relation, context }
                (single API call)
                
Benefits:
✅ Hindi/Hinglish works seamlessly
✅ Single API call (fast)
✅ Better context understanding
✅ No local model downloads
```

---

## Project Structure

```
RemindAR/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── face_recognition.py  # InsightFace
│   ├── gemini_stt.py        # Gemini transcription + extraction
│   ├── gemini_service.py    # Gemini summarization/normalization
│   ├── config.py            # API key configuration
│   ├── database.py          # SQLite
│   └── firebase_sync.py     # Firestore
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
│
└── README.md
```

---

## Configuration

**Backend**: Runs on port 8000

**Frontend**: Create `.env`:
```env
VITE_WS_URL=ws://localhost:8000/ws
```

**Gemini API**: Add your key in `backend/.env`:
```env
GEMINI_API_KEY=your-key-here
```

**Firebase**: Place `firebase-credentials.json` in backend directory. Falls back to SQLite-only if not present.

---

## Troubleshooting

**Voice extraction not working**  
Check that your Gemini API key is set in `backend/.env`

**Camera not working**  
Check browser permissions. Try Chrome.

**Faces not recognized**  
Register faces first. Good lighting helps.

---

## Tech Stack

- FastAPI
- MediaPipe
- InsightFace
- **Gemini 3 Flash** (transcription + extraction)
- Firebase Firestore
- React / TypeScript / Vite

---

## License

MIT

---

Built for people with memory challenges and their caregivers.

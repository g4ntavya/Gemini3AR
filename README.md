# RemindAR

A real-time face recognition system with AR overlays, designed to help people with memory challenges recognize and remember the people in their lives.

---

## Overview

RemindAR uses your webcam to detect faces, recognize identities, and display contextual information as floating labels. Think of it as a prototype for smart glasses that could help someone with dementia remember their family, caregivers, and friends.

**How it works:**
- Face detection runs in the browser using MediaPipe
- Face recognition uses InsightFace embeddings on the backend
- **Gemini 3.0 preview** for voice input transcription, extraction, and context queries
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

Open `https://localhost:5173` and allow camera access.

> **Note**: HTTPS is required for camera/microphone access. The dev server uses a self-signed certificate.

---

## Features

### Face Detection & Recognition
- **MediaPipe** runs in-browser for fast, client-side detection
- **InsightFace** embeddings matched using cosine similarity on the backend
- Real-time WebSocket communication for instant results

### AR Face Labels (Redesigned)
- **Modern typography**: Rozha One serif for names, Helvetica Neue for details
- **Hover-activated blur box**: Appears on hover (desktop) or tap (mobile)
- **Auto-fade**: Box fades after 3 seconds of inactivity

### Voice Registration (Gemini 3.0 preview)
- Speak naturally in your language
- Gemini transcribes + extracts structured data in ONE call
- Supports English, Hindi, and Hinglish!

### Ask Gemini - Context Memory Queries
- Tap the **Ask** button to query your contact memory
- Ask questions like "Who did I talk to about coffee?"
- Gemini searches your people database and responds naturally
- **Gemini Insights** overlay shows matched people with context along with date.

### Dashboard Sidebar
- **Swipeable cards**: iOS-style swipe-to-reveal edit/delete actions
- **Search**: Filter by name, relation, or context
- **Newest first**: Most recent entries appear at the top
- **Text-to-speech**: Read person info aloud

### Mobile & iOS Support
- **Fullscreen camera** on mobile devices
- **PWA ready**: Add to home screen for standalone mode
- **HTTPS**: Required for camera/mic access on iOS
- **Proxy configuration**: Mobile devices connect through Vite proxy

---

## Registering Faces

1. Click "Add this person" on an unknown face
2. Click "Speak" and say something like: "That's Sarah, my doctor, she prescribed medication"
3. Form auto-fills with extracted info (name, relation, context)
4. Click Save

---

## Architecture

```
Frontend (React + TypeScript + Vite)
├── MediaPipe face detection (in-browser)
├── WebSocket for face recognition
├── AR overlay with CSS blur effects
├── Swipeable dashboard cards
└── Ask Gemini voice queries

Backend (FastAPI + Python)
├── InsightFace recognition
├── Gemini 3.0 preview (transcription + extraction + queries)
└── SQLite + Firebase storage
```

### Gemini Integration

```
Voice Registration:
User speaks → Gemini 3.0 preview → { transcription, name, relation, context }
                 (single API call)

Context Queries:
User asks → Gemini 3.0 preview → { answer, matched people }
                 (searches your database)
                 
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
│   ├── gemini_stt.py        # Voice transcription + extraction
│   ├── ask_gemini.py        # Context memory queries
│   ├── config.py            # API key configuration
│   ├── database.py          # SQLite
│   └── firebase_sync.py     # Firestore sync
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AROverlay.tsx        # Face labels with hover box
│   │   │   ├── AskGeminiButton.tsx  # Voice query button
│   │   │   ├── DashboardSidebar.tsx # People management
│   │   │   ├── SwipeableCard.tsx    # iOS-style swipe cards
│   │   │   └── GeminiResponseOverlay.tsx
│   │   ├── hooks/
│   │   │   ├── useFaceDetection.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useSpeechToText.ts
│   │   └── styles/
│   │       └── index.css            # Global styles + fonts
│   ├── public/
│   │   ├── fonts/                   # Helvetica Neue, Rozha One
│   │   └── manifest.json            # PWA config
│   └── vite.config.ts               # HTTPS + proxy config
│
└── README.md
```

---

## Configuration

**Backend**: Runs on port 8000

**Frontend**: Vite dev server runs on port 5173 with HTTPS

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
Check browser permissions. HTTPS is required for camera access.

**Faces not recognized**  
Register faces first. Good lighting helps.

**Mobile not connecting**  
Ensure your phone is on the same network. Use the Vite proxy (requests go through frontend server).

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, GSAP
- **Detection**: MediaPipe Face Detection
- **Recognition**: InsightFace
- **AI**: Gemini 3.0 preview (transcription, extraction, queries)
- **Storage**: Firebase Firestore, SQLite
- **Fonts**: Rozha One, Helvetica Neue

---

## License

MIT

---

Built for people with memory challenges and their caregivers.

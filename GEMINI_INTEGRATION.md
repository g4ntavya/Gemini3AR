# Gemini Flash Integration Guide

This document explains how Gemini Flash is integrated into RemindAR for **speech-to-text, extraction, summarization, and multilingual understanding**.

---

## 🎯 Core Architecture (Updated)

> **Gemini handles STT + Extraction in ONE call. Whisper has been removed.**

| Component | Before | After |
|-----------|--------|-------|
| **Speech-to-Text** | Whisper (local) | Gemini Flash (cloud) |
| **Slot Extraction** | Phi-3 (local) | Gemini Flash (cloud) |
| **Summarization** | None | Gemini Flash |
| **Multilingual** | Limited | Native Hindi/Hinglish |

### New Flow

```
User speaks → Gemini Flash → Transcription + Extracted Fields → UI Autofill
             (single API call)

Benefits:
✅ Hindi/Hinglish works seamlessly
✅ Single API call (was 2 before)
✅ Better context understanding
✅ No local model downloads needed
```

---

## 📊 Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE INPUT PATH (Gemini)                    │
│                                                                 │
│  User speaks ──► Gemini Flash ──► { transcription,             │
│                   (single call)       name,                     │
│                                       relation,                 │
│                                       context,                  │
│                                       language }                │
│                          │                                      │
│                          ▼                                      │
│                    Auto-fill form fields                        │
│                                                                 │
│  Languages: English, Hindi, Hinglish (mixed)                   │
│  Speed: ~2-3 seconds                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   FACE RECOGNITION (Still Local)                │
│                                                                 │
│  Camera ──► MediaPipe ──► InsightFace ──► AR Overlay           │
│             (browser)     (backend)                            │
│                                                                 │
│  This path is UNCHANGED - Gemini is NOT used here              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Where Gemini is Used

### 1️⃣ Conversation Memory Summarization

**File:** `gemini_service.py` → `generate_conversation_summary_with_gemini()`

**Purpose:** Convert full conversation transcript into one clean English memory.

**When Triggered:**
- Silence detected for ≥5 seconds
- Face leaves camera frame
- User presses "Save Memory" button

**Why Gemini (not Phi):**
- Phi-3 is optimized for extracting slots from single sentences
- Gemini understands full conversation context
- Gemini handles mixed languages (Hindi + English)
- Gemini removes filler words naturally

**API Endpoint:** `POST /api/summarize-conversation`

```bash
curl -X POST http://localhost:8000/api/summarize-conversation \
  -H "Content-Type: application/json" \
  -d '{"transcript": ["Hello Sarah", "How are you?", "Good to see you"]}'
```

---

### 2️⃣ Memory Normalization & Cleanup

**File:** `gemini_service.py` → `normalize_memory_with_gemini()`

**Purpose:** Clean up Phi-3's raw extraction output before saving.

**When Triggered:**
- After Phi-3 extraction
- Before saving to database

**Why Gemini (after Phi):**
- Phi-3 extracts fast but outputs raw text ("aditya", "my friend", long context)
- Gemini normalizes: "Aditya", "Friend", "Met at coffee shop" (≤8 words)

**API Endpoint:** `POST /api/extract-normalized?normalize=true`

```bash
curl -X POST "http://localhost:8000/api/extract-normalized?normalize=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "thats aditya my friend from college"}'
```

---

### 3️⃣ Multilingual Handling

**File:** `gemini_service.py` → `translate_and_summarize_with_gemini()`

**Purpose:** Handle non-English or mixed-language transcripts.

**When Triggered:**
- Whisper detects non-English or mixed language

**Why Gemini:**
- Phi-3 is English-optimized
- Local translation is slow/unreliable
- Gemini handles Hindi, Hinglish, and other languages natively

**API Endpoint:** `POST /api/translate-summarize`

```bash
curl -X POST http://localhost:8000/api/translate-summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Yeh mera bhai hai, college mein padhta hai"}'
```

---

### 4️⃣ Dashboard Intelligence

**File:** `gemini_service.py` → `generate_dashboard_insights_with_gemini()`

**Purpose:** Generate insights for caregiver dashboard.

**When Triggered:**
- Dashboard page loads
- User requests insights

**Why Gemini:**
- Requires high-level reasoning across multiple memories
- Pattern recognition (common topics)
- Natural language summaries for caregivers

**API Endpoint:** `GET /api/dashboard/insights?days=7`

```bash
curl http://localhost:8000/api/dashboard/insights?days=7
```

---

## 🚫 Where Gemini is NOT Used

| Component | File | Why Local |
|-----------|------|-----------|
| Face Detection | Frontend (MediaPipe) | Per-frame, must be instant |
| Face Recognition | `face_recognition.py` | Embedding matching, fast |
| Live AR Overlay | `AROverlay.tsx` | Real-time UI updates |
| Whisper STT | `speech_to_text.py` | Local for privacy |
| Phi Slot Extraction | `llm_extraction.py` | <2s per utterance |

---

## 🔑 API Key Configuration

The Gemini API key is configured in `backend/config.py`:

```python
# Option 1: Environment variable
export GEMINI_API_KEY=your-key-here

# Option 2: .env file in backend/
echo "GEMINI_API_KEY=your-key-here" > backend/.env
```

**Security:** The `.env` file is in `.gitignore` and will not be committed.

---

## 🔄 Fallback Behavior

If Gemini API is unavailable:

1. **Summarization:** Returns last transcript line (truncated)
2. **Normalization:** Uses basic `.title()` capitalization
3. **Translation:** Returns error, frontend should retry or skip
4. **Dashboard:** Returns empty insights

All fallbacks are implemented in `gemini_service.py`.

---

## 📈 Performance Characteristics

| Function | Expected Latency | Acceptable For |
|----------|-----------------|----------------|
| `generate_conversation_summary_with_gemini` | 1-3 seconds | End of conversation |
| `normalize_memory_with_gemini` | 0.5-1 second | Before save |
| `translate_and_summarize_with_gemini` | 1-2 seconds | Multilingual input |
| `generate_dashboard_insights_with_gemini` | 2-5 seconds | Dashboard load |

---

## 🗂️ File Structure

```
backend/
├── config.py              # API key configuration
├── gemini_service.py      # All Gemini Flash functions
├── llm_extraction.py      # Phi-3 extraction (unchanged)
├── speech_to_text.py      # Whisper STT (unchanged)
├── main.py                # API endpoints including new Gemini routes
└── .env                   # API key (gitignored)
```

---

## 🧪 Testing the Integration

```bash
# 1. Start the backend
cd backend
python main.py

# 2. Test summarization
curl -X POST http://localhost:8000/api/summarize-conversation \
  -H "Content-Type: application/json" \
  -d '{"transcript": ["Hello", "How are you?"], "person_name": "Sarah"}'

# 3. Test normalization
curl -X POST "http://localhost:8000/api/extract-normalized?normalize=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "thats aditya my friend"}'

# 4. Test translation
curl -X POST http://localhost:8000/api/translate-summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Yeh mera dost hai"}'

# 5. Test dashboard insights
curl http://localhost:8000/api/dashboard/insights
```

---

## 📝 Summary

| Feature | Local (Phi/Whisper) | Gemini Flash |
|---------|--------------------|--------------| 
| Per-utterance extraction | ✅ | ❌ |
| Conversation summarization | ❌ | ✅ |
| Memory normalization | ❌ | ✅ |
| Multilingual handling | ❌ | ✅ |
| Dashboard insights | ❌ | ✅ |
| Realtime AR overlay | ✅ | ❌ |

**Gemini is the brain for reflection. Phi is the brain for realtime.**

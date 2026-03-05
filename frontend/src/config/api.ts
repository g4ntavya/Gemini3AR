// API Configuration
// In production (Vercel), hit the backend directly.
// In development, use relative URLs with Vite proxy.
const isProd = import.meta.env.PROD;
const API_BASE = isProd ? 'https://api.remindar.tech' : '';

// WebSocket URL
export const WS_URL = (() => {
    if (isProd) return 'wss://api.remindar.tech/ws';
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }
    return 'ws://localhost:8000/ws';
})();

// API endpoints
export const API = {
    people: `${API_BASE}/people`,
    registerFace: (id: string) => `${API_BASE}/register-face/${id}`,
    transcribeAndExtract: `${API_BASE}/api/transcribe-and-extract`,
    askGemini: `${API_BASE}/api/ask-gemini`,
};

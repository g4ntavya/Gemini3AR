// API Configuration - Uses Vite proxy (relative URLs)

// WebSocket URL - auto-detects HTTPS
export const WS_URL = (() => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }
    return 'ws://localhost:8000/ws';
})();

// API endpoints (relative URLs work with Vite proxy)
export const API = {
    people: '/people',
    registerFace: (id: string) => `/register-face/${id}`,
    transcribeAndExtract: '/api/transcribe-and-extract',
    askGemini: '/api/ask-gemini',
};

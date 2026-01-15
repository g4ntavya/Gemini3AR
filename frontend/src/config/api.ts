// API Configuration
// Uses Vite proxy in development (relative URLs work with proxy)
// This solves the HTTPS/HTTP mixed content issue on mobile

const getApiHost = () => {
    // If explicitly set in environment, use that
    if (import.meta.env.VITE_API_HOST) {
        return import.meta.env.VITE_API_HOST;
    }

    // In development with Vite proxy, use empty string (relative URLs)
    // The proxy in vite.config.ts forwards /api, /ws, /people etc. to backend
    // This works for both localhost and network access (mobile)
    return '';
};

export const API_HOST = getApiHost();

// WebSocket URL - use secure WebSocket when on HTTPS
const getWsUrl = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws`;
    }
    return 'ws://localhost:8000/ws';
};

export const WS_URL = getWsUrl();

// API endpoints (relative URLs work with Vite proxy)
export const API = {
    people: '/people',
    registerFace: (id: string) => `/register-face/${id}`,
    transcribeAndExtract: '/api/transcribe-and-extract',
    askGemini: '/api/ask-gemini',
};

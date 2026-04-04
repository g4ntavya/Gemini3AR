// API Configuration
// In production (Vercel), hit the backend directly.
// In development, use relative URLs with Vite proxy.
const isProd = import.meta.env.PROD;
const API_BASE = isProd ? 'https://api.remindar.tech' : '';

// ---- Auth-aware fetch ----

let _getToken: (() => Promise<string | null>) | null = null;
let _getRegion: (() => string) | null = null;

/** Call once from App.tsx to wire up Firebase auth token getter */
export function setTokenGetter(fn: () => Promise<string | null>) {
    _getToken = fn;
}

/** Call once from App.tsx to wire up region getter */
export function setRegionGetter(fn: () => string) {
    _getRegion = fn;
}

/** Get current region code */
export function getCurrentRegion(): string | null {
    return _getRegion ? _getRegion() : null;
}

/** fetch() wrapper that automatically attaches Authorization: Bearer <token> */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    if (_getToken) {
        const token = await _getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
}

// ---- WebSocket URL (token as query param) ----

export function getWsUrl(token?: string): string {
    let url: string;
    if (isProd) {
        url = 'wss://api.remindar.tech/ws';
    } else if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        url = `${protocol}//${window.location.host}/ws`;
    } else {
        url = 'ws://localhost:8000/ws';
    }
    if (token) url += `?token=${encodeURIComponent(token)}`;
    return url;
}

// ---- API endpoints ----

export const API = {
    people: `${API_BASE}/people`,
    registerFace: (id: string) => `${API_BASE}/register-face/${id}`,
    transcribeAndExtract: `${API_BASE}/api/transcribe-and-extract`,
    askGemini: `${API_BASE}/api/ask-gemini`,
};


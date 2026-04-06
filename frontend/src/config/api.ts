// API Configuration
// Always hit the backend on the Oracle VM (works for both dev and prod)
const API_BASE = 'https://api.remindar.tech';

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
    // Always use deployed backend WebSocket
    const url = 'wss://api.remindar.tech/ws';
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

// ---- API endpoints ----

export const API = {
    people: `${API_BASE}/people`,
    registerFace: (id: string) => `${API_BASE}/register-face/${id}`,
    personHistory: (id: string) => `${API_BASE}/people/${id}/history`,
    transcribeAndExtract: `${API_BASE}/api/transcribe-and-extract`,
    askGemini: `${API_BASE}/api/ask-gemini`,
};


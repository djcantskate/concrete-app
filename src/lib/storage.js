// storage.js
// All API communication with the backend.
// Handles auth token storage in localStorage and provides functions for
// auth (register, login, logout, getCurrentUser) and session CRUD.
//
// API_URL is injected at build time via the VITE_API_URL environment variable.
// All authenticated requests attach the JWT as a Bearer token in the
// Authorization header via getAuthHeaders().

const API_URL = import.meta.env.VITE_API_URL;

// Token helpers — store and retrieve the JWT from localStorage
export function getToken() {
    return localStorage.getItem('authToken');
}

export function setToken(token) {
    localStorage.setItem('authToken', token);
}

export function clearToken() {
    localStorage.removeItem('authToken');
}

// Builds headers for authenticated requests.
// Omits the Authorization header if no token exists (e.g. before login).
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

// Shared fetch helper — throws with the server's error message if the response is not ok
async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
    }
    return response.json();
}

// Auth functions

export async function register(username, password, email) {
    const data = await apiFetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
    });
    setToken(data.token);
    return data.user;
}

export async function login(username, password) {
    const data = await apiFetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data.user;
}

export function logout() {
    clearToken();
}

export async function getCurrentUser() {
    return apiFetch(`${API_URL}/me`, { headers: getAuthHeaders() });
}

// Session functions

export async function loadSessions() {
    return apiFetch(`${API_URL}/sessions`, { headers: getAuthHeaders() });
}

export async function createSession(session) {
    return apiFetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(session),
    });
}

export async function updateSession(session) {
    return apiFetch(`${API_URL}/sessions/${session._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(session),
    });
}

export async function deleteSession(sessionId) {
    return apiFetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
}

// Places functions
// These call the backend proxy routes which in turn call Google's APIs.
// The API key never touches the frontend.

export async function getPlacesAutocomplete(input) {
    return apiFetch(`${API_URL}/places/autocomplete?input=${encodeURIComponent(input)}`, {
        headers: getAuthHeaders(),
    });
}

export async function getPlaceDetails(placeId) {
    return apiFetch(`${API_URL}/places/details?place_id=${encodeURIComponent(placeId)}`, {
        headers: getAuthHeaders(),
    });
}

export async function geocodeCoordinates(lat, lng) {
    return apiFetch(`${API_URL}/places/geocode?lat=${lat}&lng=${lng}`, {
        headers: getAuthHeaders(),
    });
}

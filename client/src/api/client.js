// Shared HTTP helper. Adds the logged-in user's token to every request
// and tells the app when the server says the token is no longer valid.
const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// Called with no arguments when a request returns 401 (expired / invalid token).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function request(path, { method = 'GET', body, skipAuthRedirect = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (res.status === 401 && !skipAuthRedirect) onUnauthorized?.();

  if (!res.ok) {
    const error = new Error(data?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.fields = data?.errors;
    throw error;
  }
  return data;
}

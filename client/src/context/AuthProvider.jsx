import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { authApi } from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

const TOKEN_KEY = 'todo-token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable: user stays logged in for this tab only */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True while we check a token saved from a previous visit
  const [checking, setChecking] = useState(() => Boolean(readStoredToken()));

  const logout = useCallback(() => {
    setAuthToken(null);
    storeToken(null);
    setUser(null);
  }, []);

  // Restore the session on page load
  useEffect(() => {
    setUnauthorizedHandler(logout);
    const saved = readStoredToken();
    if (!saved) return;

    setAuthToken(saved);
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(logout)
      .finally(() => setChecking(false));
  }, [logout]);

  const startSession = useCallback(({ token, user }) => {
    setAuthToken(token);
    storeToken(token);
    setUser(user);
  }, []);

  const login = useCallback(async (credentials) => startSession(await authApi.login(credentials)), [startSession]);
  const register = useCallback(async (details) => startSession(await authApi.register(details)), [startSession]);

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

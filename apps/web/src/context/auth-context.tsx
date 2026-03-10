"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import {
  clearToken,
  decodePayload,
  isTokenValid,
  readStoredToken,
  saveToken,
  setClientToken,
} from "@/lib/auth";
import type { JwtUser } from "@/lib/auth";

interface AuthContextValue {
  /** Decoded JWT payload for the logged-in user, or null if unauthenticated. */
  user: JwtUser | null;
  /** Raw JWT string, or null. */
  token: string | null;
  /** Call after a successful POST /api/auth/login response. */
  login: (token: string) => void;
  /** Clear session and redirect to /login. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

interface AuthState {
  token: string | null;
  user: JwtUser | null;
}

/**
 * Lazy initializer — runs once on the client, never on the server (SSR guard).
 * Reads localStorage, validates the token, and wires the module-level store.
 * Eliminates the need for a separate useEffect that calls multiple setState.
 */
function readInitialAuth(): AuthState {
  if (typeof window === "undefined") return { token: null, user: null };

  const stored = readStoredToken();
  if (stored && isTokenValid(stored)) {
    const payload = decodePayload(stored);
    if (payload) {
      setClientToken(stored);
      return { token: stored, user: payload };
    }
  }
  clearToken();
  setClientToken(null);
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ token, user }, setAuthState] = useState<AuthState>(readInitialAuth);

  const login = useCallback((newToken: string) => {
    const payload = decodePayload(newToken);
    if (!payload) return;
    saveToken(newToken);
    setClientToken(newToken);
    setAuthState({ token: newToken, user: payload });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setClientToken(null);
    setAuthState({ token: null, user: null });
    // Hard redirect so middleware cookie check is re-evaluated
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

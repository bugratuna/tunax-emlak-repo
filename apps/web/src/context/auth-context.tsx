"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtUser | null>(null);

  // Rehydrate from localStorage on first mount
  useEffect(() => {
    const stored = readStoredToken();
    if (stored && isTokenValid(stored)) {
      const payload = decodePayload(stored);
      if (payload) {
        setToken(stored);
        setUser(payload);
        setClientToken(stored); // wire the module-level store for apiFetch
        return;
      }
    }
    // Stale or invalid token — clear both stores
    clearToken();
    setClientToken(null);
  }, []);

  const login = useCallback((newToken: string) => {
    const payload = decodePayload(newToken);
    if (!payload) return;
    saveToken(newToken);
    setClientToken(newToken);
    setToken(newToken);
    setUser(payload);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setClientToken(null);
    setToken(null);
    setUser(null);
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

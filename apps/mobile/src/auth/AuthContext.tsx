import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearTokens, getAccessToken } from '../api/client';
import { login as apiLogin } from '../api/auth';
import { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if a token is already stored
  useEffect(() => {
    getAccessToken()
      .then((token) => {
        // Token present but we have no user object yet (e.g., app restart).
        // A full implementation would call GET /api/auth/me here.
        // For M1, we mark as authenticated with a placeholder user when token exists.
        if (token) {
          setUser({ id: 'stored', email: '', role: 'CONSULTANT' });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

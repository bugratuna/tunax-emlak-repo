import { create } from 'zustand';
import type { AuthUser, JwtPayload } from '@tunax/shared';
import { clearAllTokens } from '../lib/tokenManager';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  // isLoading stays true until the initial SecureStore token check completes.
  // The root layout shows nothing until this resolves, preventing a flash to login.
  isLoading: boolean;
}

interface AuthActions {
  setUserFromJwt: (payload: JwtPayload) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUserFromJwt: (payload: JwtPayload) =>
    set({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      isAuthenticated: true,
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  logout: async () => {
    await clearAllTokens();
    set({ user: null, isAuthenticated: false });
  },
}));

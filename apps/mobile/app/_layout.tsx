import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { getToken } from '../src/lib/tokenManager';
import { parseJwt, isTokenExpired } from '../src/lib/jwt';
import { registerLogoutCallback } from '../src/services/client';
import '../global.css';

// ── QueryClient (singleton, created outside component to survive re-renders) ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Auth guard ────────────────────────────────────────────────────────────────
// Mounted inside QueryClientProvider so it can access query context if needed.
// Handles three responsibilities:
//   1. Register the logout callback for the Axios 401 interceptor
//   2. Read SecureStore on mount to hydrate authStore (app launch)
//   3. Watch authStore.isAuthenticated and redirect to correct route group
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setUserFromJwt, setLoading, logout } = useAuthStore();

  // Register logout with the Axios client so 401 responses clear auth state
  useEffect(() => {
    registerLogoutCallback(logout);
  }, [logout]);

  // Initial token check: runs once on app launch
  useEffect(() => {
    async function checkStoredToken() {
      try {
        const token = await getToken();

        if (!token || isTokenExpired(token)) {
          // No token or token is expired — ensure store is clean
          await logout();
          return;
        }

        const payload = parseJwt(token);
        if (!payload) {
          // Token present but unparseable — clear and treat as logged out
          await logout();
          return;
        }

        setUserFromJwt(payload);
      } finally {
        // Always stop loading, even if an error occurred
        setLoading(false);
      }
    }

    checkStoredToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation guard: redirect based on auth state, runs after loading resolves
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config';
import { getToken } from '../lib/tokenManager';

// ── Logout callback ───────────────────────────────────────────────────────────
// Registered by the root layout to avoid a circular import between client ↔ store.
// The interceptor calls this on 401 so the auth store can clear state and
// the navigation guard can redirect to login.
type LogoutFn = () => Promise<void>;
let _logoutCallback: LogoutFn | null = null;

export function registerLogoutCallback(fn: LogoutFn): void {
  _logoutCallback = fn;
}

// ── Axios instance ────────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor: inject Bearer token ──────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (_logoutCallback) {
        await _logoutCallback();
      }
    }
    return Promise.reject(error);
  },
);

// ── Typed API error ───────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function extractApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message =
      (data?.message as string) ??
      (data?.error as string) ??
      error.message ??
      'Bir hata oluştu.';
    return new ApiError(status, message);
  }
  if (error instanceof Error) {
    return new ApiError(0, error.message);
  }
  return new ApiError(0, 'Bilinmeyen hata.');
}

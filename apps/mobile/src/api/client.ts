import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function storeTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  authenticated?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (authenticated) {
    let token = await getAccessToken();
    if (!token) throw new ApiError(401, 'Not authenticated');
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetchOnce(path, method, headers, body);
    if (res.status === 401) {
      // Try silent refresh
      token = await refreshAccessToken();
      if (!token) throw new ApiError(401, 'Session expired');
      headers['Authorization'] = `Bearer ${token}`;
      return handleResponse<T>(await fetchOnce(path, method, headers, body));
    }
    return handleResponse<T>(res);
  }

  return handleResponse<T>(await fetchOnce(path, method, headers, body));
}

function fetchOnce(
  path: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  let message = `HTTP ${res.status}`;
  try {
    const err = await res.json();
    message = err.message ?? err.error ?? message;
  } catch {
    // ignore parse error
  }
  throw new ApiError(res.status, message);
}

export const apiClient = {
  get: <T>(path: string, authenticated = false) =>
    request<T>(path, { authenticated }),
  post: <T>(path: string, body: unknown, authenticated = false) =>
    request<T>(path, { method: 'POST', body, authenticated }),
  patch: <T>(path: string, body: unknown, authenticated = false) =>
    request<T>(path, { method: 'PATCH', body, authenticated }),
};

import type { LoginResponse } from '@tunax/shared';
import { apiClient } from './client';
import { setToken } from '../lib/tokenManager';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  await setToken(res.data.accessToken);
  return res.data;
}

/**
 * Register a new consultant account.
 * Backend always assigns CONSULTANT role and sets status to PENDING_APPROVAL.
 * The caller must show a pending-approval message — do NOT attempt to login immediately.
 */
export async function register(dto: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}): Promise<void> {
  await apiClient.post('/api/auth/register', dto);
}

/**
 * Fire-and-forget logout. Token is cleared locally regardless of API response.
 */
export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout', {});
  } catch {
    // Ignore — token is already cleared in authStore.logout()
  }
}

// TODO: POST /api/auth/login — not yet implemented in API
// TODO: POST /api/auth/refresh — not yet implemented in API

import { apiClient, storeTokens } from './client';
import { AuthTokens, AuthUser } from '../types';

interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  await storeTokens(res.accessToken, res.refreshToken);
  return res;
}

import type { JwtPayload } from '@tunax/shared';

/**
 * Decode a JWT without verifying the signature.
 * Signature verification happens server-side on every API call.
 * We use this client-side only to read non-sensitive claims (sub, email, role, exp).
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Convert URL-safe base64 → standard base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    // Pad to multiple of 4
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);

    // atob is available as a global in React Native 0.77+
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or cannot be parsed.
 * Adds a 30-second buffer so we treat nearly-expired tokens as expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  const bufferMs = 30 * 1000;
  return Date.now() >= payload.exp * 1000 - bufferMs;
}

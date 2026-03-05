/**
 * Client-safe auth helpers.
 * No imports from next/headers or any server-only modules.
 * Safe to import in both client components and server code.
 */

export const TOKEN_KEY = "arep_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 h

export interface JwtUser {
  sub: string;
  email: string;
  role: "ADMIN" | "CONSULTANT";
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Module-level token store — set by AuthProvider on mount/login so that
// apiFetch() can read it without prop-drilling.
// Only meaningful in the browser; server-side it stays null.
// ---------------------------------------------------------------------------
let _clientToken: string | null = null;

export function setClientToken(token: string | null): void {
  _clientToken = token;
}

export function getClientToken(): string | null {
  return _clientToken;
}

// ---------------------------------------------------------------------------
// Persist / clear
// ---------------------------------------------------------------------------

/**
 * Write the JWT to both localStorage and a same-site cookie.
 * localStorage  → read by AuthProvider / module store (client components)
 * cookie        → read by Next.js middleware (route protection)
 */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

/** Read raw JWT from localStorage (browser only). */
export function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// JWT payload decode (no signature verification — server enforces validity)
// ---------------------------------------------------------------------------

/**
 * Base64url-decode the middle segment of a JWT and parse the payload.
 * Returns null on any error (malformed, expired, etc.).
 */
export function decodePayload(token: string): JwtUser | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    // Base64url → base64 → JSON
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as JwtUser;
  } catch {
    return null;
  }
}

/** Return true if the token exists and has not passed its exp claim. */
export function isTokenValid(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload) return false;
  if (payload.exp == null) return true;
  return payload.exp * 1000 > Date.now();
}

/**
 * Server-only auth helpers.
 * Uses next/headers — must NOT be imported by client components.
 * Import only from Server Components, Route Handlers, and Server Actions.
 */
import { cookies } from "next/headers";
import { decodePayload } from "@/lib/auth";
import type { JwtUser } from "@/lib/auth";

/** Read the raw JWT from the arep_token cookie (server-side). */
export async function getServerToken(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get("arep_token")?.value ?? null;
  } catch {
    // cookies() throws outside of a request context (e.g. during static build)
    return null;
  }
}

/** Decode and return the JWT payload from the server-side cookie. */
export async function getServerUser(): Promise<JwtUser | null> {
  const token = await getServerToken();
  if (!token) return null;
  return decodePayload(token);
}

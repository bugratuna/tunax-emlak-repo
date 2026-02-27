import type { ApiError } from "@/lib/types";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    const msg = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    super(msg);
    this.name = "ApiRequestError";
  }
}

function baseUrl(): string {
  const url =
    typeof window === "undefined"
      ? process.env.API_BASE_URL_SERVER ?? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local.",
    );
  }
  return url.replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let body: ApiError;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      body = {
        statusCode: res.status,
        message: res.statusText,
        error: "Unknown",
      };
    }
    throw new ApiRequestError(res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/**
 * Server-side only — called exclusively from /api/proxy/* Next.js Route Handlers.
 * Adds x-internal-api-key header from the INTERNAL_API_KEY env var (no NEXT_PUBLIC_ prefix).
 * Never call this from browser client code.
 */
export async function internalApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    throw new Error(
      "INTERNAL_API_KEY is not set. Add it to .env.local (no NEXT_PUBLIC_ prefix).",
    );
  }
  return apiFetch<T>(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-internal-api-key": key },
  });
}

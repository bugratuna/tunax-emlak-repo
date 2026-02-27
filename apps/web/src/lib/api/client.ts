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
  console
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

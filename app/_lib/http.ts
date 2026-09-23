/**
 * Thin JSON helpers for calling our own route handlers from client components. When an
 * organizer is signed in, every call carries their access token, so the write routes can act
 * as that user (row level security decides what they may touch).
 */
import { getAccessToken } from "./supabase-browser";

const JSON_HEADERS = { "Content-Type": "application/json" };

/** A non-2xx answer from our API, with the status so callers can tell 401 from the rest. */
export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpStatusError";
  }
}

function messageFrom(parsed: unknown, path: string, status: number): string {
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    return String((parsed as { error: unknown }).error);
  }
  return `Request to ${path} failed with status ${status}.`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init: RequestInit & { headers?: Record<string, string> }): Promise<T> {
  const response = await fetch(path, { ...init, headers: { ...init.headers, ...(await authHeaders()) } });
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new HttpStatusError(response.status, messageFrom(parsed, path, response.status));
  return parsed as T;
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { cache: "no-store" });
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) });
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(body) });
}

/** DELETE with the session token; the routes answer 204 without a body. */
export async function deleteRequest(path: string): Promise<void> {
  const response = await fetch(path, { method: "DELETE", headers: await authHeaders() });
  if (!response.ok) {
    const parsed: unknown = await response.json().catch(() => null);
    throw new HttpStatusError(response.status, messageFrom(parsed, path, response.status));
  }
}

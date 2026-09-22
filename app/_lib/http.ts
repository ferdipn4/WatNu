/** Thin JSON helpers for calling our own route handlers from client components. */

const JSON_HEADERS = { "Content-Type": "application/json" };

function messageFrom(parsed: unknown, path: string, status: number): string {
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    return String((parsed as { error: unknown }).error);
  }
  return `Request to ${path} failed with status ${status}.`;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messageFrom(parsed, path, response.status));
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

async function parseJsonSafe(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function messageFrom(parsed: unknown, path: string, status: number): string {
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    return String((parsed as { error: unknown }).error);
  }
  return `Request to ${path} failed with status ${status}.`;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = await parseJsonSafe(response);
  if (!response.ok) throw new Error(messageFrom(parsed, path, response.status));
  return parsed as T;
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const parsed = await parseJsonSafe(response);
  if (!response.ok) throw new Error(messageFrom(parsed, path, response.status));
  return parsed as T;
}

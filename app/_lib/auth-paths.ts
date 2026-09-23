/** Sign-in URL helpers, usable from Server and Client Components alike (no hooks, no "use client"). */

/** A safe in-app path for `?next=` after sign-in: same-origin, absolute, never a protocol-relative URL. */
export function safeNextPath(value: string | null | undefined, fallback = "/profile"): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function signInHref(next: string): string {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

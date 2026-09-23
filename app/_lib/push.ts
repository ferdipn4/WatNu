"use client";

/**
 * Push reminders on this phone: a notification on the day of a saved event, and one when a saved
 * date gets cancelled. The subscription lives on the server keyed by a token only this phone knows
 * (localStorage); the saved ids travel with it so the sender (app/api/push/run) knows what to say.
 * Needs the installed app's service worker (production builds) and the VAPID public key.
 */
import { deleteRequest, patchJson, postJson } from "./http";

const TOKEN_KEY = "watnu:push-token";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushState = "unsupported" | "denied" | "off" | "on";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: reminders cannot be kept on this phone.
  }
}

/** The base64url VAPID key as the bytes `pushManager.subscribe` wants. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    PUBLIC_KEY.length > 0 &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!supported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

/** Where this phone stands: no push here, blocked, off, or on. */
export async function getPushState(): Promise<PushState> {
  if (!supported()) return "unsupported";
  const worker = await registration();
  if (!worker) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const subscription = await worker.pushManager.getSubscription();
  return subscription && readToken() ? "on" : "off";
}

/** Asks for permission, subscribes, and tells the server what this phone saved. */
export async function enablePush(savedEventIds: string[], locale: string): Promise<PushState> {
  const worker = await registration();
  if (!worker) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const subscription =
    (await worker.pushManager.getSubscription()) ??
    (await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
  const token = readToken() ?? crypto.randomUUID();
  const json = subscription.toJSON();
  await postJson("/api/push/subscriptions", {
    token,
    subscription: { endpoint: json.endpoint, keys: json.keys },
    event_ids: savedEventIds,
    locale,
  });
  writeToken(token);
  return "on";
}

/** Reminders off: the browser forgets the subscription, the server forgets this phone. */
export async function disablePush(): Promise<PushState> {
  const worker = await registration();
  const subscription = await worker?.pushManager.getSubscription();
  await subscription?.unsubscribe().catch(() => false);
  const token = readToken();
  if (token) await deleteRequest(`/api/push/subscriptions?token=${encodeURIComponent(token)}`).catch(() => undefined);
  writeToken(null);
  return worker ? "off" : "unsupported";
}

/** After a save or unsave: the server's copy of this phone's list follows. Fire and forget. */
export function syncPushSavedEvents(savedEventIds: string[]): void {
  const token = readToken();
  if (!token) return;
  void patchJson("/api/push/subscriptions", { token, event_ids: savedEventIds }).catch(() => {
    // A lost sync is corrected by the next one; a save must never fail because of it.
  });
}

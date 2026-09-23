/*
 * WatNu service worker — what makes the installed app open without a connection.
 *
 * Strategy per request (GET only; nothing signed-in is ever cached):
 * - page navigations and their RSC payloads: network first, the last copy when offline, /offline as the last resort
 * - /_next/static, the icons and the manifest: cache first (hashed, immutable)
 * - GET /api/events* and /api/organizers* without an Authorization header: network first, last copy offline
 * - poster and logo images from Supabase Storage: cache first, trimmed to the newest 120
 * Bump VERSION to drop every old cache on the next activation.
 *
 * It also shows the push reminders (app/api/push/run sends them): the payload carries title, body,
 * the url to open and a tag, so a reminder and a cancellation for the same date never stack up.
 */
const VERSION = "watnu-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const DATA_CACHE = `${VERSION}-data`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = "/offline";
const MAX_IMAGES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Anything for a signed-in organizer stays out of every cache.
  if (request.headers.has("authorization")) return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, OFFLINE_URL));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon" || url.pathname === "/apple-icon" || url.pathname === "/manifest.webmanifest") {
      event.respondWith(cacheFirst(request, ASSET_CACHE));
      return;
    }
    if (url.searchParams.has("_rsc")) {
      event.respondWith(networkFirst(request, SHELL_CACHE));
      return;
    }
    if ((url.pathname.startsWith("/api/events") || url.pathname.startsWith("/api/organizers")) && !url.pathname.endsWith("/stats")) {
      event.respondWith(networkFirst(request, DATA_CACHE));
      return;
    }
    return;
  }

  if (url.pathname.includes("/storage/v1/object/public/")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGES));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const options = {
    body: data.body || "",
    icon: "/icon",
    badge: "/icon",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "WatNu", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => "focus" in client);
      if (open) {
        if ("navigate" in open) open.navigate(url);
        return open.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
    if (maxEntries) trimCache(cache, maxEntries);
  }
  return response;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

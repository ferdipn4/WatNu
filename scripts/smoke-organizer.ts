/**
 * End-to-end check of organizer accounts and row level security against a running dev server.
 * Signs in as a demo organizer, then walks the write routes: reads /api/me, re-saves the own
 * profile (a no-op write), publishes a throwaway event, edits and deletes it — and proves that
 * another organizer's profile and slug are refused.
 *
 * Usage (dev server must be running, account from scripts/create-demo-organizer.ts):
 *   node --env-file=.env.local --experimental-strip-types scripts/smoke-organizer.ts <email> <password>
 */
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.WATNU_BASE_URL ?? "http://localhost:3000";
const [email, password] = process.argv.slice(2);

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`);
}

async function api(token: string | null, method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  return { status: response.status, json };
}

function errorOf(json: unknown): string {
  return json && typeof json === "object" && "error" in json ? String((json as { error: unknown }).error) : "";
}

async function main(): Promise<void> {
  if (!email || !password) {
    console.error("Usage: smoke-organizer.ts <email> <password>");
    process.exitCode = 1;
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set (pass --env-file=.env.local).");

  // 1. Sign in exactly like the app does.
  const supabase = createClient(new URL(url).origin, anonKey, { auth: { persistSession: false } });
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session) throw new Error(`Sign-in failed: ${signIn.error?.message ?? "no session"}`);
  const token = signIn.data.session.access_token;
  record("sign in", true, email);

  // 2. Without a token the write routes refuse.
  const anon = await api(null, "GET", "/api/me");
  record("anonymous /api/me is 401", anon.status === 401, `status ${anon.status}`);

  // 3. Who am I, and which organizer do I manage?
  const me = await api(token, "GET", "/api/me");
  const organizers = (me.json as { organizers?: { slug: string; name: string }[] } | null)?.organizers ?? [];
  record("/api/me lists a managed organizer", me.status === 200 && organizers.length > 0, `status ${me.status}, ${organizers.map((o) => o.slug).join(", ") || "none"}`);
  const own = organizers[0]?.slug;
  if (!own) throw new Error("This account manages no organizer; link one with scripts/create-demo-organizer.ts first.");
  // An admin (scripts/make-admin.ts) may write everywhere, so the "refused" checks flip for it.
  const isAdmin = (me.json as { is_admin?: boolean } | null)?.is_admin === true;
  if (isAdmin) console.log("      (this account is an admin: cross-organizer writes are expected to succeed)");

  const directory = await api(null, "GET", "/api/organizers");
  const other = ((directory.json as { organizers?: { slug: string }[] } | null)?.organizers ?? []).find((o) => o.slug !== own)?.slug;

  // 4. Re-save the own profile (same description → a no-op write that still passes through RLS).
  const profile = await api(null, "GET", `/api/organizers/${encodeURIComponent(own)}`);
  const description = (profile.json as { organizer?: { description: string | null } } | null)?.organizer?.description ?? null;
  const ownPatch = await api(token, "PATCH", `/api/organizers/${encodeURIComponent(own)}`, { description });
  record("update own profile", ownPatch.status === 200, `status ${ownPatch.status} ${errorOf(ownPatch.json)}`);

  // 5. Another organizer's profile is invisible to the update (unless this account is an admin).
  if (other) {
    const otherProfile = await api(null, "GET", `/api/organizers/${encodeURIComponent(other)}`);
    const otherDescription = (otherProfile.json as { organizer?: { description: string | null } } | null)?.organizer?.description ?? null;
    // Same description → a no-op write for an admin, so nothing changes either way.
    const otherPatch = await api(token, "PATCH", `/api/organizers/${encodeURIComponent(other)}`, { description: otherDescription });
    if (isAdmin) record("admin updates another organizer", otherPatch.status === 200, `status ${otherPatch.status} ${errorOf(otherPatch.json)}`);
    else record("update another organizer is refused", otherPatch.status === 404, `status ${otherPatch.status} ${errorOf(otherPatch.json)}`);
  }

  // 6. Publish, edit and delete a throwaway event under the own slug.
  const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const created = await api(token, "POST", "/api/events", {
    title: "Smoke test (delete me)",
    start,
    location_name: "Smoke test",
    category: "Social",
    price_eur: 0,
    organizer_slug: own,
    newcomer_friendly: false,
  });
  const eventId = (created.json as { event?: { id: string } } | null)?.event?.id;
  record("publish own event", created.status === 201 && Boolean(eventId), `status ${created.status} ${errorOf(created.json)}`);

  if (eventId) {
    // 6a. Search finds it by a word of the title and by the organizer's name.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const byTitle = await api(null, "GET", `/api/events?${new URLSearchParams({ q: "delete me", from: since })}`);
    const titleHit = ((byTitle.json as { events?: { id: string }[] } | null)?.events ?? []).some((e) => e.id === eventId);
    record("search finds the event by title", byTitle.status === 200 && titleHit, `status ${byTitle.status}`);
    const ownName = organizers[0]?.name ?? own;
    const byOrganizer = await api(null, "GET", `/api/events?${new URLSearchParams({ q: ownName, from: since })}`);
    const organizerHit = ((byOrganizer.json as { events?: { id: string }[] } | null)?.events ?? []).some((e) => e.id === eventId);
    record("search finds the event by organizer name", byOrganizer.status === 200 && organizerHit, `status ${byOrganizer.status}, q=${JSON.stringify(ownName)}`);

    // 6b. Stats: anyone records a view, the organizer reads the numbers, strangers only once they are public.
    const view = await api(null, "POST", "/api/metrics", { kind: "event_view", id: eventId });
    record("record a view (anonymous)", view.status === 204, `status ${view.status} ${errorOf(view.json)}`);
    const ownStats = await api(token, "GET", `/api/organizers/${encodeURIComponent(own)}/stats`);
    const stats = (ownStats.json as { stats?: { views?: number; public?: boolean } } | null)?.stats;
    record("organizer reads stats", ownStats.status === 200 && typeof stats?.views === "number" && stats.views >= 1, `status ${ownStats.status}, views ${stats?.views ?? "?"}`);
    const anonStats = await api(null, "GET", `/api/organizers/${encodeURIComponent(own)}/stats`);
    const anonAllowed = anonStats.status === 200 && (anonStats.json as { stats?: { public?: boolean } } | null)?.stats?.public === true;
    record("stats respect stats_public for strangers", anonStats.status === 403 || anonAllowed, `status ${anonStats.status}${anonAllowed ? " (public)" : ""}`);

    // 6b2. "This is wrong": anyone reports, the organizer reads and resolves.
    const reported = await api(null, "POST", `/api/events/${eventId}/reports`, { reason: "wrong_time", message: "Starts at 20:00, not 19:00." });
    const reportId = (reported.json as { report?: { id: string } } | null)?.report?.id;
    record("anyone reports an event", reported.status === 201 && Boolean(reportId), `status ${reported.status} ${errorOf(reported.json)}`);
    const reports = await api(token, "GET", `/api/events/${eventId}/reports`);
    const reportListed = ((reports.json as { reports?: { id: string }[] } | null)?.reports ?? []).some((r) => r.id === reportId);
    record("organizer reads the reports", reports.status === 200 && reportListed, `status ${reports.status}`);
    if (reportId) {
      const resolved = await fetch(`${BASE_URL}/api/reports/${reportId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      record("organizer resolves a report", resolved.status === 204, `status ${resolved.status}`);
    }

    const edited = await api(token, "PATCH", `/api/events/${eventId}`, { title: "Smoke test (edited)" });
    record("edit own event", edited.status === 200, `status ${edited.status} ${errorOf(edited.json)}`);

    // 6c. A weekly series lists one occurrence per week inside the window asked for.
    const weekly = await api(token, "PATCH", `/api/events/${eventId}`, { recurrence: "weekly" });
    record("make the event weekly", weekly.status === 200, `status ${weekly.status} ${errorOf(weekly.json)}`);
    const windowQuery = new URLSearchParams({ ids: eventId, from: new Date().toISOString(), to: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString() });
    const listed = await api(null, "GET", `/api/events?${windowQuery}`);
    const occurrences = ((listed.json as { events?: { id: string; start: string }[] } | null)?.events ?? []).filter((e) => e.id === eventId);
    record(
      "weekly event lists one occurrence per week",
      listed.status === 200 && occurrences.length === 4 && new Set(occurrences.map((e) => e.start)).size === 4,
      `status ${listed.status}, ${occurrences.length} occurrences`,
    );

    // 6d. Skipping one date marks that occurrence cancelled without removing it from the list.
    const secondStart = occurrences[1]?.start;
    if (secondStart) {
      const skipKey = new Date(secondStart).toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
      const skipped = await api(token, "PATCH", `/api/events/${eventId}`, { skipped_dates: [skipKey] });
      const relisted = await api(null, "GET", `/api/events?${windowQuery}`);
      const rows = ((relisted.json as { events?: { id: string; start: string; cancelled?: boolean }[] } | null)?.events ?? []).filter((e) => e.id === eventId);
      const cancelledRows = rows.filter((e) => e.cancelled);
      record(
        "skipped date comes back as cancelled",
        skipped.status === 200 && rows.length === 4 && cancelledRows.length === 1 && cancelledRows[0].start === secondStart,
        `status ${skipped.status}, ${rows.length} rows, ${cancelledRows.length} cancelled`,
      );
    }

    const deleted = await fetch(`${BASE_URL}/api/events/${eventId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    record("delete own event", deleted.status === 204, `status ${deleted.status}`);
  }

  // 6e. Access requests: anyone may ask; only admins read, decide and remove.
  const asked = await api(null, "POST", "/api/organizer-requests", {
    organization: "Smoke Test Society",
    contact_name: "Smoke Tester",
    email: "smoke@example.test",
    instagram_handle: "@smoketest",
    message: "Delete me.",
  });
  const requestId = (asked.json as { request?: { id: string | null } } | null)?.request?.id;
  record("anyone may ask for access", asked.status === 201 && Boolean(requestId), `status ${asked.status} ${errorOf(asked.json)}`);
  const inbox = await api(token, "GET", "/api/organizer-requests?status=pending");
  if (isAdmin) {
    const listed = ((inbox.json as { requests?: { id: string }[] } | null)?.requests ?? []).some((r) => r.id === requestId);
    record("admin reads the requests", inbox.status === 200 && listed, `status ${inbox.status}`);
    if (requestId) {
      const declined = await api(token, "PATCH", `/api/organizer-requests/${requestId}`, { status: "declined" });
      record("admin declines a request", declined.status === 200, `status ${declined.status} ${errorOf(declined.json)}`);
      const removed = await fetch(`${BASE_URL}/api/organizer-requests/${requestId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      record("admin removes a request", removed.status === 204, `status ${removed.status}`);
    }
  } else {
    record("non-admin cannot read the requests", inbox.status === 403, `status ${inbox.status} (this account is not an admin)`);
  }

  // 7. Publishing under another organizer's slug is refused by RLS (an admin may, and the event is removed again).
  if (other) {
    const foreign = await api(token, "POST", "/api/events", {
      title: "Smoke test (must be refused)",
      start,
      category: "Social",
      organizer_slug: other,
    });
    const foreignId = (foreign.json as { event?: { id: string } } | null)?.event?.id;
    if (isAdmin) record("admin publishes under another slug", foreign.status === 201 && Boolean(foreignId), `status ${foreign.status} ${errorOf(foreign.json)}`);
    else record("publish under another slug is refused", foreign.status === 403, `status ${foreign.status} ${errorOf(foreign.json)}`);
    if (foreignId) {
      const cleaned = await fetch(`${BASE_URL}/api/events/${foreignId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      record("the admin's foreign event is removed again", cleaned.status === 204, `status ${cleaned.status}`);
    }
  }

  // 8. Storage: organizers upload media, everyone reads it, uploaders remove their own files.
  const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const mediaPath = `posters/smoke-${Date.now()}.png`;
  const upload = await supabase.storage.from("media").upload(mediaPath, onePixelPng, { contentType: "image/png" });
  record("upload media", !upload.error, upload.error?.message ?? mediaPath);
  if (!upload.error) {
    const publicUrl = supabase.storage.from("media").getPublicUrl(mediaPath).data.publicUrl;
    const read = await fetch(publicUrl);
    record("media is public", read.status === 200, `status ${read.status}`);
    const removed = await supabase.storage.from("media").remove([mediaPath]);
    record("remove own media", !removed.error && (removed.data?.length ?? 0) === 1, removed.error?.message ?? `${removed.data?.length ?? 0} removed`);
  }

  // Local scope only: the default (global) sign-out would revoke every session of this user, including a browser's.
  await supabase.auth.signOut({ scope: "local" });

  const failed = checks.filter((check) => !check.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

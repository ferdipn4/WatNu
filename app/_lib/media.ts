/**
 * Images (posters, logos) live in the public Supabase Storage bucket `media`, uploaded straight
 * from the browser with the organizer's session — no bytes pass through our API, and the row
 * only stores the public URL. Policies in supabase/schema.sql: everyone reads, signed-in
 * organizers upload, uploaders remove their own files.
 */
import { getBrowserSupabase } from "./supabase-browser";

const BUCKET = "media";
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${BUCKET}/`;

export type MediaKind = "posters" | "logos";

export function isDataUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/** Uploads a `data:` URL (the resized poster or logo) and returns its public URL. */
export async function uploadDataUrl(kind: MediaKind, dataUrl: string): Promise<string> {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Image uploads need Supabase to be configured.");

  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${kind}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Could not upload the image: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of a file this browser uploaded earlier (a replaced poster, a deleted event's image). Other URLs are ignored. */
export async function removeMedia(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const index = url.indexOf(PUBLIC_PATH_MARKER);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + PUBLIC_PATH_MARKER.length));
  try {
    await getBrowserSupabase()?.storage.from(BUCKET).remove([path]);
  } catch {
    // An orphaned file is harmless; the row no longer points at it.
  }
}

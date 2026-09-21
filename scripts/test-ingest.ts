/**
 * Posts one of the sample posters in /test-assets to the ingest endpoint and
 * prints the extracted drafts.
 *
 * Usage (dev server must be running):
 *   node --experimental-strip-types scripts/test-ingest.ts
 *   node --experimental-strip-types scripts/test-ingest.ts poster-sport.png
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.WATNU_BASE_URL ?? "http://localhost:3000";
const POSTER = process.argv[2] ?? "poster-party.png";

async function main(): Promise<void> {
  const posterPath = path.resolve(process.cwd(), "test-assets", POSTER);
  const imageBase64 = (await readFile(posterPath)).toString("base64");

  console.log(`POST ${BASE_URL}/api/ingest  (${POSTER})`);

  const response = await fetch(`${BASE_URL}/api/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType: "image/png" }),
  });

  const body: unknown = await response.json().catch(() => null);
  console.log(`status ${response.status}`);
  console.log(JSON.stringify(body, null, 2));

  if (!response.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

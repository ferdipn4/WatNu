# WatNu

Mobile-first Next.js app that shows what is happening in Maastricht.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key, used for all reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, only for `scripts/create-demo-organizer.ts`; the app never uses it |
| `ANTHROPIC_API_KEY` | Preferred AI provider |
| `XAI_API_KEY` | Fallback provider (OpenAI SDK against `https://api.x.ai/v1`) |

`lib/ai.ts` uses Anthropic when `ANTHROPIC_API_KEY` is set and otherwise falls back
to xAI. If neither key is present it throws.

Apply the database schema from `supabase/schema.sql` in the Supabase SQL editor
(it is idempotent; re-run it after pulling schema changes).

### Organizer accounts

Organizers sign in with email and password (Supabase Auth); students never do.
There is no self-signup: create a demo account and link it to an organizer with

```bash
node --env-file=.env.local --experimental-strip-types scripts/create-demo-organizer.ts demo@complex.test some-password complex-maastricht
```

Row level security does the rest: everyone reads `organizers` and `events`,
only a member of an organizer (a row in `organizer_members`) updates that
organizer and inserts, updates or deletes events under its slug. The write
routes below and `POST /api/ingest` need the signed-in user's access token in
an `Authorization: Bearer <token>` header; the app adds it automatically.

### Images

Posters and logos live in the public Storage bucket `media` (created by
`supabase/schema.sql`: `posters/<uuid>.jpg`, `logos/<uuid>.png`, 5 MB and
image types only). The browser uploads them directly with the organizer's
session (`app/_lib/media.ts`) and the row stores the public URL — `image_file`
and `logo_file` must be http(s) URLs, the API rejects `data:` URLs.

## API

All dates are handled in the `Europe/Amsterdam` timezone. The API category
vocabulary is: `Sport`, `Party`, `Café & Food`, `Culture`, `Study & Career`,
`Social`.

The examples below are written for a POSIX shell and use `curl.exe`, which is
also the correct binary on Windows — in PowerShell, `curl` is an alias for
`Invoke-WebRequest`. PowerShell mangles inline single-quoted JSON, so on Windows
put the body in a file and pass `--data-binary "@body.json"` instead of `-d`.

### `POST /api/ingest`

Extracts event drafts from one or more poster images, a block of text, or both.
Nothing is saved — an organizer reviews the drafts first. Needs a signed-in
organizer (`Authorization: Bearer <token>`), since every call costs an AI request. Each image must be
under 4 MB decoded, and a request may include at most 3 images.

```bash
curl.exe -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"text":"Neon Night at De Kroeg, vrijdag 3 oktober 22:00, Boschstraat 24, entree 7,50 euro"}'
```

With a single image, send the base64 payload (a bare base64 string or a
`data:` URL) via `imageBase64`:

```bash
curl.exe -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"<base64>","mediaType":"image/png"}'
```

For a multi-image post (e.g. an Instagram carousel), send up to 3 images via
`images` — they are sent to the model together in one request and treated as
slides of the same post, so the same event is never returned twice:

```bash
curl.exe -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"images":[{"imageBase64":"<base64 1>","mediaType":"image/png"},{"imageBase64":"<base64 2>","mediaType":"image/png"}]}'
```

If no date is visible anywhere in the images or text, the model returns
`start: null` and lists `"start"` in `missing_fields` instead of guessing —
today's date is only used to resolve relative dates like "next Friday".

`scripts/test-ingest.ts` does the base64 encoding for you:

```bash
node --experimental-strip-types scripts/test-ingest.ts poster-party.png
```

### `POST /api/events/check`

Checks one draft against what is already scheduled.

```bash
curl.exe -X POST http://localhost:3000/api/events/check \
  -H "Content-Type: application/json" \
  -d '{"title":"Neon Night","start":"2026-10-03T22:00:00+02:00","category":"Party"}'
```

Returns `conflicts` (same day, starting within three hours, with a
`same_category` flag), `possible_duplicates` (similar normalized titles on the
same day; borderline cases get an AI one-line verdict) and `suggestion`, a
plain-code recommendation of the quietest evening that week.

### `GET /api/events`

Optional query params: `category`, `from`, `to`, `free=true`, `organizer`,
`ids` (up to 100 comma-separated uuids), `q` (free text, case-insensitive, matched
against title, description, location and the organizer's name — the search screen). Ordered by `start`, with the
organizer's name and type joined in as `organizer_name` / `organizer_type`.
Every screen asks for its slice (Home from this week's Monday, My WatNu from
today plus its saved ids), never the whole table.

A recurring event (`recurrence` = `weekly` / `biweekly` / `monthly`, optional
`repeat_until` = last day) is one row whose `start` is its first occurrence.
The list routes expand it into occurrences inside `from`–`to` (`lib/occurrences.ts`):
one copy per occurrence with the same `id` and a shifted `start` / `end`. Without
`to` the window ends eight weeks after `from`; at most 60 occurrences per series.
A date the organizer skipped (`skipped_dates`) still comes back, flagged
`cancelled: true`, so saved events say "cancelled" instead of disappearing.

```bash
curl.exe "http://localhost:3000/api/events"
curl.exe "http://localhost:3000/api/events?category=Party&free=true"
curl.exe "http://localhost:3000/api/events?from=2026-10-01T00:00:00%2B02:00&to=2026-10-31T23:59:59%2B01:00&organizer=de-kroeg"
```

### `GET /api/events/[id]`

One event with its organizer joined in; 404 when there is none.

```bash
curl.exe "http://localhost:3000/api/events/<uuid>"
```

### `POST /api/events`

Saves a reviewed event using the service-role client.

```bash
curl.exe -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Neon Night","start":"2026-10-03T22:00:00+02:00","end":"2026-10-04T03:00:00+02:00","location_name":"De Kroeg","address":"Boschstraat 24, Maastricht","category":"Party","price_eur":7.5,"description":"Neon themed night with student entry.","organizer_slug":"de-kroeg","newcomer_friendly":true}'
```

`end` is optional (`null` when the poster states no end time) and must come after
`start`; ingest drafts carry it too when the poster says so. `recurrence`
(`weekly` / `biweekly` / `monthly`) and `repeat_until` (`YYYY-MM-DD`) make it a
series; ingest extracts them from "elke maandag"-style posters. Editing or
deleting a series affects every occurrence; `PATCH /api/events/[id]` with
`skipped_dates` (the whole `YYYY-MM-DD` list) cancels single dates.

### `GET /api/organizers`

```bash
curl.exe "http://localhost:3000/api/organizers"
```

### `GET /api/organizers/[slug]`

Returns the organizer plus their upcoming events.

```bash
curl.exe "http://localhost:3000/api/organizers/de-kroeg"
```

### `POST /api/metrics`

Counts one view, save or follow for the organizer's stats. Anyone may call it
(students have no account); the database only ever moves a counter by one and
checks that the event or organizer exists.

```bash
curl.exe -X POST http://localhost:3000/api/metrics   -H "Content-Type: application/json"   -d '{"kind":"event_view","id":"<event uuid>"}'
```

`kind` is one of `event_view`, `event_save`, `event_unsave`, `organizer_follow`,
`organizer_unfollow`; `id` is the event uuid or the organizer slug.

### `GET /api/organizers/[slug]/stats`

Views and saves across the organizer's events in the last 30 days, followers
all time. The organizer's own account always reads them (send the Bearer
header); everyone else only once the organizer switched `stats_public` on in
Edit profile (403 otherwise).

```bash
curl.exe -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/organizers/de-kroeg/stats
```

### `GET /api/me`

The signed-in user and the organizers they manage.

```bash
curl.exe -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/me
```

`PATCH /api/organizers/[slug]`, `PATCH /api/events/[id]` and
`DELETE /api/events/[id]` take the same header and only touch rows the signed-in
organizer manages (404 for anyone else's).

## Installing the app

`app/manifest.ts`, `app/icon.tsx` and `app/apple-icon.tsx` make WatNu
installable from the browser's "Add to Home Screen": a standalone window with
the WatNu mark as its icon. No service worker yet, so it still needs a
connection.

## Test assets

`test-assets/poster-sport.png` (Dutch, one recurring event) and
`test-assets/poster-party.png` (English, two events on one poster) are generated
placeholders. Regenerate them with:

```bash
powershell -ExecutionPolicy Bypass -File scripts/make-test-assets.ps1
```

## Checks

```bash
npx tsc --noEmit
npx eslint app lib scripts
```

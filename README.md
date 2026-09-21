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
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, server-only, used for writes |
| `ANTHROPIC_API_KEY` | Preferred AI provider |
| `XAI_API_KEY` | Fallback provider (OpenAI SDK against `https://api.x.ai/v1`) |

`lib/ai.ts` uses Anthropic when `ANTHROPIC_API_KEY` is set and otherwise falls back
to xAI. If neither key is present it throws.

Apply the database schema from `supabase/schema.sql` in the Supabase SQL editor.

## API

All dates are handled in the `Europe/Amsterdam` timezone. The API category
vocabulary is: `Sport`, `Party`, `Café & Food`, `Culture`, `Study & Career`,
`Social`.

The examples below are written for a POSIX shell and use `curl.exe`, which is
also the correct binary on Windows — in PowerShell, `curl` is an alias for
`Invoke-WebRequest`. PowerShell mangles inline single-quoted JSON, so on Windows
put the body in a file and pass `--data-binary "@body.json"` instead of `-d`.

### `POST /api/ingest`

Extracts event drafts from a poster image or a block of text. Nothing is saved —
an organizer reviews the drafts first. Images must be under 4 MB decoded.

```bash
curl.exe -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"text":"Neon Night at De Kroeg, vrijdag 3 oktober 22:00, Boschstraat 24, entree 7,50 euro"}'
```

With an image, send the base64 payload (a bare base64 string or a `data:` URL):

```bash
curl.exe -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"<base64>","mediaType":"image/png"}'
```

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

Optional query params: `category`, `from`, `to`, `free=true`, `organizer`.
Ordered by `start`, with the organizer name joined in as `organizer_name`.

```bash
curl.exe "http://localhost:3000/api/events"
curl.exe "http://localhost:3000/api/events?category=Party&free=true"
curl.exe "http://localhost:3000/api/events?from=2026-10-01T00:00:00%2B02:00&to=2026-10-31T23:59:59%2B01:00&organizer=de-kroeg"
```

### `POST /api/events`

Saves a reviewed event using the service-role client.

```bash
curl.exe -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Neon Night","start":"2026-10-03T22:00:00+02:00","location_name":"De Kroeg","address":"Boschstraat 24, Maastricht","category":"Party","price_eur":7.5,"description":"Neon themed night with student entry.","organizer_slug":"de-kroeg","newcomer_friendly":true}'
```

### `GET /api/organizers`

```bash
curl.exe "http://localhost:3000/api/organizers"
```

### `GET /api/organizers/[slug]`

Returns the organizer plus their upcoming events.

```bash
curl.exe "http://localhost:3000/api/organizers/de-kroeg"
```

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

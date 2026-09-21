# Screens

Five screens at 390px, four of them behind the TabBar. Each is listed top to bottom with the component that renders each part; the live previews under Screens show the same composition in both themes.

## 1 · Home — This week

The week, grouped by day, filtered by chips. Route `/`.

- Header: wordmark row (star + "WatNu" in accent, a neutral `pin Maastricht` tag right), `display` "This week", `meta` "Mon 21 – Sun 27 Sep · 38 events".
- Chip row (horizontal scroll, bleeds to the edges): **Today**, **Weekend**, **Free**, a separator, then the six categories. Quick filters narrow the days shown; categories are OR-ed; the row keeps its scroll position on navigation.
- Day groups: `.wn-day` header ("Today" + "Mon 21 Sep"; "Tomorrow"; then weekday names through Sunday) and a `.wn-list` of **EventCard**s sorted by start time. An event whose organizer uploaded an image shows it on top of the card (16:9, the poster they uploaded unless they changed it); the others are the compact row, and the list mixes both. A day with no events after filtering is skipped; if nothing matches at all, the empty pattern from My WatNu with "Nothing on for these filters" and a button that clears them.
- The week runs Monday to Sunday of the current week; a link "Next week" in `meta` at the end of the list loads the following one.
- **TabBar** active `week`.

## 2 · Organizers — directory and profile

Route `/organizers`, profile `/organizers/[slug]`.

- Directory: header (`display` "Organizers", `meta` count), a **Field** `search` ("Search associations, cafés, clubs" — matches name and category), a chip row **All · Associations · Cafés · Clubs & venues**, then a `.wn-list` of **OrganizerCard**s alphabetically, each with Follow. Search filters live, no submit.
- Profile: 52px top bar (round back button; round share button right), then in a `.wn-stack`: **OrgLogo** `lg` beside the `title` name, `meta` "Student association · Party", the Instagram handle as a `link` with the at icon (opens Instagram); a full-width `lg` **Follow** button (turns `secondary` "Following"); the description in `body`; the organizer stats **Card** (`maas`): caption "Promo codes redeemed · Sep", the `stat` number, the delta in `meta` maas, and the tag "Only you see this" — it renders only for the organizer (v1: the browser that published the organizer's events holds an organizer token; no accounts); then `heading` "Upcoming" with the count and the organizer's **EventCard**s in date order.
- No tab bar on the profile; back returns to the directory with scroll and search intact.

## 3 · Create event — the + tab

Route `/new`, a four-step flow with a step indicator (four 4px segments, filled in accent up to the current step) under a 52px top bar. Close on steps 1–2, back on 3–4. No tab bar.

- **Step 1 · Upload.** `heading` "Add what you already made", one `meta` line, a **Card** `upload` (dashed, `radius-xl`, at least 300px tall: an `accent-soft` disc with the upload icon, "Upload screenshot or poster" in `body-strong`, "Instagram post, story or PDF poster / Dutch is fine — we translate" in `meta`). Tapping opens the file picker (image/*, PDF); drop works on desktop. Below, a `.wn-or` divider and a `secondary` full-width **Button** "Paste text instead" that swaps the drop area for a **Field** `textarea`. A `caption` under it: "About 20 seconds. You check everything before it goes live."
- **Step 2 · Reading the image.** The upload in a floating `.wn-poster-frame` (168px wide) with the accent scan line moving over it; `heading` "Reading your poster…", `meta` "Usually under 20 seconds"; a **Card** listing what has been found so far as `.wn-check` rows with maas checks — Title, Date and time, Place, Price, each with the raw Dutch value in bold — and the current step spinning in accent ("Translating from Dutch…"). Rows appear as the extraction streams; the step advances automatically when done. If extraction fails: the same card with one amber row "Couldn't read this image" and a `secondary` button "Paste text instead".
- **Step 3 · Editable preview.** Top bar "Check the details". A **Card** `maas` `tight` note with the translate icon: "Translated from Dutch — Read from your poster. Check the amber fields." Then the Image row (label "Image"; a `tight` Card with a 56px thumbnail of the upload, "Your poster / Shown on the card and the event page", a `sm` secondary "Change" that opens the picker; pasted-text events have "Add an image" here instead and publish as compact cards). Then **Field**s, 12px apart: Title; Date + Start (`.wn-grid-2`); End + Price; Location; Address; Category (`select`, `trailing` "AI guess" when inferred); Newcomers welcome (`switch`, hint "Your poster says "iedereen welkom""); Description (`textarea`). Any field the AI could not read is `missing` (amber, hint "Not on the poster — please add it"). A sticky `.wn-footer` holds the `lg` full-width **Button** "Check & continue"; it is enabled once Title, Date, Start and Location are set.
- **Step 4 · Checks, then publish.** Top bar "Before you publish". A `caption` "How it will look on Thursday" over the **EventCard** exactly as it will appear on Home (`onSave={null}`, with the image when there is one). Then up to three **WarningPanel**s, each only when it applies: `conflict` — "3 other events Thursday evening, 2 of them Sport" with one sentence relating it to this event's category; `duplicate` — "Is this the same as "Board Game Evening"?" with the other event's organizer · day · time and the answers **Yes, same event** (outline: merges into the existing listing, adds this organizer as co-host) / **No, different** (primary); `suggestion` — "Wednesday is quieter: 1 event" with **Move to Wednesday** (outline: changes the date and returns to step 3 with the date field highlighted). The sticky footer holds **Publish**. After publishing: Home, scrolled to the event, with the one maas toast.

## 4 · My WatNu

Route `/mine`. Everything the student saved plus every upcoming event from organizers they follow; no login, state in `localStorage`.

- Header: wordmark row, `display` "My WatNu", `meta` "Saved events and everything from organizers you follow. No account — it lives on this phone."
- A **Card** `sunken` `tight` row: the `.wn-avatars` strip of followed **OrgLogo**s (`sm`, round, up to three, then "+4"), "Following 3 organizers" in `body-strong`, a chevron; tapping opens the directory filtered to followed organizers, where Follow buttons unfollow.
- Day groups as on Home (Today, Tomorrow, weekday), **EventCard**s with `saved` set for bookmarked ones; a followed organizer's event shows with an empty bookmark — saving it fills it. Past events drop off at midnight.
- Empty state (`.wn-empty`): the `accent-soft` disc with the bookmark icon, `heading` "Nothing here yet", one `body` muted sentence, a primary **Button** "Browse this week", a ghost **Button** "Find organizers".
- **TabBar** active `mine` (the bookmark icon filled).

## 5 · Event detail — and the promo QR sheet

Route `/e/[id]`. Opened from any EventCard. No tab bar; a round on-image back button instead.

- Hero: the same image as on the card — the organizer's upload — in `.wn-hero` (`radius-xl`, 16:10, `object-fit: cover`), with round `onImage` buttons over it: back left; share and bookmark right. No image → no hero; the screen starts with a 52px top bar (back, share, bookmark) and the tags row.
- Tags row: the category, **Newcomers welcome** (maas) when set, **10% off** (accent, ticket icon) when a promo exists.
- `title` event name. Three `.wn-fact` rows: clock — "Tonight, Mon 21 Sep · 20:00–23:00" ("Tonight"/"Tomorrow" replaces the weekday within 48 hours); pin — location in `body-strong` with the address and a walking distance in `meta` (tapping opens the map app); euro — "Free" in maas or the price, with a `meta` note ("No ticket, just show up" / "Pay at the door" / a ticket link).
- Description in `body`, the AI's English translation of the poster text; a `caption` "Translated from Dutch" under it when it was.
- Organizer row: a **Card** `tight` with **OrgLogo**, name in `body-strong`, "Student association · 2 upcoming" in `meta`, a chevron; opens the profile.
- Actions: two `secondary` **Button**s in `.wn-grid-2` — **Save** (bookmark; filled and labelled "Saved" in accent when saved) and **Add to calendar** (downloads an .ics with title, times, location and the event URL in the notes).
- Promo **Card** (`accent`, only when the organizer set a promo): a round `accent-soft` disc with the qr icon, "10% off with WatNu" in `body-strong` accent, "Show the QR code at the door" in `meta`, a chevron. Tapping opens the sheet.
- The QR sheet: `scrim` over the screen, a `.wn-sheet` (`radius-xl` top corners, `shadow-float`) with a handle, `title` "10% off with WatNu", `meta` "Salsa Sociëteit at Café Mestreech · tonight until 23:00", the QR at 220px on a white `.wn-qr` tile (always white, black modules), the code in the display face for the person at the door who prefers to type it, `meta` "Show this to the person at the door", a `secondary` full-width **Done**. The code encodes `WATNU:<promo>:<date>`; a scan by the organizer's phone counts as a redemption and feeds the stats card.

## Feature flags on the screens

Every control below reads `features.ts` (README → Feature states). Where a flag is `soon`, the control stays where the screen shows it, dashed with a Soon tag, and taps show the info Toast; where it is `off`, it is not rendered.

- Home: `eventImages` (card images), `save` (bookmarks), `search`. Organizers: `follow`, `search`, `organizerStats` (the stats Card → the `soon` WarningPanel "Organizer stats arrive with the next version"). Create: `aiImport`, `pasteText`, `pdfUpload` (step 1 copy), `translation` (the note), `conflictCheck` / `duplicateCheck` / `suggestions` (each panel; a `soon` check shows one dashed panel "Duplicate check is not in this version yet" instead). My WatNu: `save`, `follow` (both `local` in v1: the header line says "No account — it lives on this phone"). Event detail: `save`, `calendarExport` (the Add to calendar button), `share`, `promoCodes` (the promo card and QR sheet; `off` removes the card and the 10% off tag).

## Data the screens need

- Event: `id, title, description, date, start, end?, location, address?, category, price (0 = free), newcomers, image?, organizerId, promo? { label, code, validUntil }, sourceLanguage`.
- Organizer: `id, slug, name, type (association | cafe | club | venue), category, instagram, description, logo?, redemptions[]`.
- Local state (student): `saved: eventId[]`, `following: organizerId[]`. Local state (organizer): `organizerToken` set when they publish.

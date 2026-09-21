WatNu ("what now?") puts everything happening in Maastricht on one screen. Student associations, cafés and clubs promote on their own Instagram, often in Dutch, so nothing reaches new people and no student has an overview. An organizer uploads a screenshot of their post or poster, the AI turns it into a clean English event, and every student in town can find it. Two people use it: a student planning their week, and an organizer who wants reach without extra work. This system is the mobile web app at 390px — five screens built from a handful of components — in light and dark.

## Principles

- **Local, not touristy.** The colours are the city's — Maastricht red on warm white, the Maas as the second hue — but nothing on screen is a landmark, a flag or a bridge. The place shows in the copy (Wyck, Sint Pieter, "6 min walk from the station"), not in decoration.
- **One bold colour.** `accent` does the pointing: the + button, the primary button, selected chips, the active tab, a saved bookmark. Everything else is warm neutrals. If two things on a screen are accent, one of them is wrong.
- **Newcomers first.** A first-year who speaks no Dutch must be able to open any screen and know what to do. English only, plain words, times in 24-hour, and the "Newcomers welcome" tag wherever an organizer means it.
- **The organizer's poster is the source of truth; the app is the clean copy.** Their image stays their image: it becomes the card image on Home and the hero on the detail screen, as uploaded. The listing around it is ours: same layout for every event, no organizer branding leaking into the text.
- **Build it in two hours.** Five components carry the product (EventCard, OrganizerCard, Chip, Button, WarningPanel); three carry structure (Card, TabBar, Field), plus Toast. Every screen is a list of those with a header. No screen introduces a new pattern.
- **Say what works.** The frontend never pretends: a feature the backend does not have yet is still on screen, dashed and marked Soon, and says so when tapped; a feature that is not part of the product is not on screen at all (see Feature states).

## Voice and content

- The product speaks English, in sentence case, short and direct: "Nothing here yet", "Show the QR code at the door", "3 other events Thursday evening". No exclamation marks in UI text; organizers' descriptions keep theirs.
- Name the user "you" and the organizer "you" too; the app is never "we" except in a promise ("we translate").
- Times are 24-hour with a colon: `19:30`, ranges with an en dash and no spaces: `20:00–23:00`. Dates are `Thu 24 Sep` (weekday, day, short month, no year in-app). Day headers on lists are **Today**, **Tomorrow**, then the weekday name (**Wednesday**), each with the date beside it in `meta`.
- Prices: `€8` or the **Free** tag — never "€0", "from €8" or "tickets". Free events are most of the app; the tag is maas, not accent, so it doesn't shout.
- Categories are exactly six, in this order everywhere: Sport, Party, Café & Food, Culture, Study & Career, Social. One per event. Organizer types are four: Student association, Café, Club, Venue.
- "Newcomers welcome" is a claim the organizer makes (a switch on the review form, pre-set when the poster says "iedereen welkom" or the like). Show it as the maas tag on cards and on the detail screen; students can filter on it later.
- AI provenance is always visible: the review form opens with the maas note "Translated from Dutch", fields the AI could not read are amber with "Not on the poster — please add it", and a field it inferred carries "AI guess" beside the label. Never silently fill a field.
- Warnings are counts and questions, not judgements: "3 other events Thursday evening, 2 of them Sport", "Is this the same as …?", "Wednesday is quieter: 1 event". Publish is never blocked.
- No emoji in the UI. Organizers' posters are full of them; the AI strips them from titles and keeps them in the description only if the organizer wrote them.
- Sample content in this system (Salsa Sociëteit, Café Mestreech, Maas Rowing, Loods Maas, Filmhuis Wyck, SV Mosa, Bar Boekhandel, SBE Career Club) is invented. Replace it with real organizers as they sign up.

## Colour

Two themes, the same tokens. Light is warm white; dark is warm near-black, never blue-grey. `accent` is Maastricht red (`#d01f29` light, `#ff6b66` dark — lightened so it still reads on dark, with `on-accent` switching to ink). `maas` is the river: a quiet teal for Free, success, suggestions, links and the translation note. `warn` amber means "check this". There are no other hues, and no category colours: categories are words in neutral tags.

- Set the page on `surface`; cards, the tab bar, sheets and inputs on `surface-raised` with a 1px `line` border; chips at rest, the search field, the secondary button and monogram tiles on `surface-sunken`.
- Text is `ink`; secondary lines (location · organizer, dates, hints, tab labels) are `ink-muted`. Both hold ≥ 4.5:1 on every surface and every soft tint in both themes (16.9:1 and 5.6:1 on `surface` in light; 16.4:1 and 7.3:1 in dark).
- Use `accent` for: the primary button fill, the + button, selected chips, the active tab, the filled bookmark, the focus ring, the promo card's text on `accent-soft`. As text it reads on `surface`, `surface-raised` and `accent-soft` (4.7:1 light, 5.6:1 dark). Text on an accent fill is `on-accent`, never literal white.
- Use `maas` for: the Free tag and Newcomers welcome tag on `maas-soft`, the suggestion panel, the stats card, the "Translated from Dutch" note, links and Instagram handles (`link` is an alias of `maas`). On `maas-soft` it holds 5.3:1 light, 7.9:1 dark.
- Use `warn` on `warn-soft` for the conflict and duplicate panels and a missing field; the 1.5px `warn-line` border makes the state visible without colour vision (3.4:1 light, 5.3:1 dark) and the hint text says it in words.
- Pressed: primary buttons go `accent-strong`; everything else scales to 98%. Disabled: 45% opacity, no colour change.
- `scrim` (70%) sits behind bottom sheets. The QR tile inside the promo sheet stays white with black modules in both themes — scanners need it.

## Typography

Two Google Fonts, two jobs. **Bricolage Grotesque** (`display` family, weights 500–800, optical size on) is the playful half: screen titles, day headers, the time on cards, the big number on the stats card, the promo code. **DM Sans** (`sans` family, 400–700) is the clean half: everything read rather than glanced at.

- `display` 32/36 800 for the one title per top-level screen (This week, Organizers, My WatNu). `title` 24/28 700 for the event name on the detail screen, the organizer name on a profile, sheet titles. `heading` 18/24 700 for day headers and section headers. `time` 17/20 700 with tabular numerals for the time column. `stat` 40/44 800 for the one number on the stats card.
- `body` 15/22 400 for descriptions and panel bodies; `body-strong` 15/20 600 for event titles on cards, organizer names, button labels and field values; `meta` 13/18 500 for the location · organizer line, dates and hints; `label` 13/16 600 for chips and field labels; `caption` 12/16 600 for tags, tab labels and the step counter.
- Letter-spacing is negative on the display face (−0.02em at 32px, −0.01em below) and slightly positive on captions (+0.01em). Never all-caps in the UI; the posters may shout, the app doesn't.
- Load both with `next/font/google` (`Bricolage_Grotesque` with `axes: ['opsz']`, `DM_Sans`) and expose them as CSS variables `--font-display` and `--font-sans`; no font files ship with the app.

## Spacing and layout

- 4px base; the scale is `space-1` 4 … `space-10` 40 and maps 1:1 to Tailwind's default `p-1 … p-10`. Screen gutter 16 (`space-4`); cards in a list 12 apart (`space-3`); sections 24 apart (`space-6`); the first title sits 32 under the status bar (`space-8`).
- Design width 390 (`size-screen`). Layouts are fluid from 360 to 430; above 480 the app is a centred 430px column on `surface-sunken`.
- Every top-level screen: status bar → header (wordmark row, `display` title, one `meta` line) → an optional chip row bleeding to the edges → content → the TabBar. Flows (create, detail) replace the header with a 52px top bar (a round back or close button left, a `heading` centred) and drop the tab bar.
- Lists scroll under the fixed TabBar; give the scroll area 96px bottom padding (112 when a sticky footer button is present).
- Cards are full-bleed within the gutter (358px wide). Two short fields share a row with a 12px gap (`.wn-grid-2`). Touch targets are 44px (`size-touch`); large actions 52px (`size-button-lg`).

## Radius, borders, shadows

- `radius-sm` 8: tags, the translation note, step segments. `radius-md` 12: buttons, inputs, logo tiles. `radius-lg` 16: cards and panels. `radius-xl` 24: event images, the upload area, bottom sheets. `radius-full`: chips, the + button, avatar strips. Tailwind: `rounded-lg / xl / 2xl / 3xl / full`.
- Cards sit on a 1px `line` border with the near-invisible `shadow-card` (none in dark). Borders do the separating; shadows do not.
- Only two things float: the + button (`shadow-fab`, an accent glow) and bottom sheets (`shadow-float`). Nothing else has a shadow. No gradients anywhere; the posters bring their own.
- Focus is the `focus-ring` shadow on every control: 2px page-colour gap, 2px solid accent, following the radius.

## States and feedback

- Saved: the bookmark on a card fills with `accent`; on the detail screen the Saved button label turns accent. Following: the organizer's button becomes `secondary` "Following" with a check. Both are local state — there are no accounts — persisted in `localStorage` and mirrored on My WatNu.
- Selected chip: `accent` fill, `on-accent` label, `aria-pressed`. Active tab: `accent` icon and label; the bookmark icon fills.
- Missing field (review form): `warn-soft` ground, `warn-line` border, amber hint with a warning icon. Inferred field: "AI guess" in maas beside the label.
- Loading (create step 2): the uploaded poster in a floating frame with a thin accent scan line moving over it, a `heading` "Reading your poster…", and a card listing what has been found so far with maas checks; the last line spins in accent. No skeletons, no spinners elsewhere — lists load with the page.
- Empty (My WatNu): a 72px `accent-soft` disc with the bookmark icon, a `heading`, one sentence in `body` muted, a primary button to This week and a ghost button to Organizers.
- Published: return to This week scrolled to the new event, with a maas toast "Published — it's live for everyone in Maastricht" for 4 seconds. That is the only toast.
- Warnings never block. The three checks before publishing are panels with an answer each; Publish stays enabled below them.
- Not yet available: a control whose feature is `soon` keeps its place and size, turns dashed and `ink-muted` with a "Soon" tag inside (Button `soon`, Chip tone `soon`, WarningPanel tone `soon`), and on tap shows the info Toast "Not in this version yet — coming soon". Never grey-out silently, never fake a result.

## Iconography and logo

- Stroke icons, 24px grid, 1.75px stroke, round caps — the `lucide-react` spec. The bundle's Icon carries the 29 glyphs the screens use; in the build import them from `lucide-react` by the same names (home, users, plus, bookmark, clock, map-pin, calendar, chevron-right, arrow-left, search, share, triangle-alert, copy, lightbulb, check, upload, image, at-sign, text, scan, ticket, qr-code, trending-up, languages, x, euro, star, loader). Icons are `currentColor` and decorative unless they stand alone.
- The mark is a `radius-xl` accent tile with the white five-pointed star — the star from the city's own arms, drawn plain. `assets/Logos/watnu-mark.svg` (two inks: `#d01f29` tile, `#ffffff` star), `watnu-star.svg` (single ink `#d01f29`, for the wordmark row and dark surfaces) and `watnu-wordmark.svg` (the name set in Bricolage Grotesque 800, outlined, single ink `#d01f29`). In the header row the wordmark is the star icon plus "WatNu" in `display` 18px accent; the mark alone is the app icon and favicon. Never stretch, recolour to another hue, or set the name in another face.

## Components

Nine components, one bundle (`window.WatNu`, React 18). Every screen is composed only from these plus text styles and layout classes; the previews under Screens are built exactly that way, so they double as the reference for the Next.js build.

- **EventCard** — the row every list is made of; with `image` it carries the organizer's poster on top at 16:9. **OrganizerCard** — the directory row with Follow. **Chip** — filter pill (md) or static tag (sm). **Button** — primary / secondary / outline / ghost in three sizes, plus the `soon` state. **WarningPanel** — the three checks before publishing (conflict, duplicate, suggestion) and the `soon` notice.
- **Card** — the surface: raised, sunken, accent (promo), maas (stats, translation note), upload (drop area). **TabBar** — This week · Organizers · + · My WatNu. **Field** — text, textarea, select, search, switch, with the `missing` state. **Toast** — the one transient line (done / info). **OrgLogo** and **Icon** are the two small helpers the others share.
- What stays plain markup: day headers (`heading` + `meta` in `.wn-day`), the screen header, the 52px top bar, the step indicator, the fact rows on the detail screen, the promo QR sheet (a Card-like sheet over a `scrim`).
- Tailwind mapping is direct: a card is `rounded-2xl border border-line bg-surface-raised p-4 shadow-card`; a chip is `h-[34px] rounded-full border border-line bg-surface-raised px-3.5 text-[13px] font-semibold` and selected `bg-accent border-accent text-on-accent`; a primary button is `h-11 rounded-xl bg-accent text-on-accent px-4 font-semibold active:bg-accent-strong`. Every value is in the token sheet below.

## Feature states

The design shows every feature as it should work. The build ships whatever the backend has, so a `features.ts` map is the single place that says what this version can do, and every dependent control reads it:

```ts
export type FeatureStatus = 'live' | 'local' | 'soon' | 'off';
export const features = {
  eventImages: 'live',   // the organizer's image on cards and the detail hero
  aiImport: 'live',      // upload → AI reads the poster (step 2)
  pasteText: 'live',
  pdfUpload: 'soon',     // step 1 accepts images only until the backend reads PDFs
  translation: 'live',   // the "Translated from Dutch" note
  conflictCheck: 'soon', // step 4 panels — each one separately
  duplicateCheck: 'soon',
  suggestions: 'soon',
  save: 'local',         // bookmark → localStorage
  follow: 'local',       // follow → localStorage
  calendarExport: 'soon',
  share: 'live',
  promoCodes: 'soon',    // the promo card, the QR sheet
  organizerStats: 'soon',
  search: 'live',
} as const satisfies Record<string, FeatureStatus>;
```

- `live`: the control looks and works as designed. `local`: works without the backend, state in `localStorage`, one `meta` hint where the data lives ("No account — it lives on this phone"). `soon`: the control stays in its place and size, dashed and muted with a Soon tag; tapping shows the info Toast. `off`: not rendered — no tag, no empty card, the layout closes up.
- Set the values from what the backend really provides before every release; the values above are placeholders for the first build, not a statement about the backend. A `soon` panel replaces a card whose data would otherwise be faked (the stats card shows "Organizer stats arrive with the next version", never "0 redeemed").
- Step 1 says which inputs work: with `pdfUpload: 'soon'` the upload area reads "Instagram post or story · PDF soon".

## Screens

The five screens — Home (This week), Organizers and the organizer profile, Create event in four steps, My WatNu, Event detail with the promo QR sheet — are specified in the **Screens** section and shown live under Screens in the component table, each at 390px with light and dark. They are the reference: implement them one to one — same structure, copy, spacing and components — with only the feature flags deciding what a given build can show.

## Tokens

Everything below is `tokens.json`, restated for a `tailwind.config.ts`. Colours are light / dark.

| token | light | dark | use |
| --- | --- | --- | --- |
| `surface` | `#faf8f5` | `#141110` | page ground |
| `surface-raised` | `#ffffff` | `#1f1b19` | cards, tab bar, sheets, inputs |
| `surface-sunken` | `#f1ede7` | `#2a2522` | chips at rest, search, secondary button, logo tiles |
| `line` | `#e5dfd7` | `#372f2b` | 1px hairlines |
| `ink` | `#1a1614` | `#f4efe9` | text |
| `ink-muted` | `#6b625b` | `#aaa097` | secondary text |
| `accent` | `#d01f29` | `#ff6b66` | the one bold colour |
| `accent-strong` | `#b8151f` | `#ff8a85` | pressed accent |
| `accent-soft` | `#fdecec` | `#3d1a18` | promo card, association tiles |
| `on-accent` | `#ffffff` | `#1a1614` | text on accent |
| `maas` | `#0b6b76` | `#5fd0dc` | Free, success, suggestions, links |
| `maas-soft` | `#dcf2f4` | `#0f2e32` | tinted ground for maas |
| `on-maas` | `#ffffff` | `#0b1a1c` | text on a maas fill |
| `warn` | `#8a5200` | `#ffc857` | check-this text |
| `warn-soft` | `#fff0d4` | `#3a2a08` | amber panels, missing fields |
| `warn-line` | `#b87413` | `#b8862b` | amber borders |
| `scrim` | `#1a1614b3` | `#000000b3` | behind sheets |

Fonts: `display` = "Bricolage Grotesque" (Google Fonts, opsz 12–96, wght 500–800); `sans` = "DM Sans" (Google Fonts, wght 400–700). Styles: display 32/36/800, title 24/28/700, heading 18/24/700, time 17/20/700, stat 40/44/800; body 15/22/400, body-strong 15/20/600, meta 13/18/500, label 13/16/600, caption 12/16/600.

Radius: sm 8 · md 12 · lg 16 · xl 24 · full 9999. Spacing: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 (Tailwind 1 · 2 · 3 · 4 · 5 · 6 · 8 · 10). Sizes: touch 44, button-lg 52, chip 34, logo 44 (72 on profiles), tab bar 64 + safe area, fab 56, screen 390.

```ts
// tailwind.config.ts — extend only; the default spacing scale already matches
extend: {
  colors: {
    surface: { DEFAULT: 'var(--surface)', raised: 'var(--surface-raised)', sunken: 'var(--surface-sunken)' },
    line: 'var(--line)', ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)' },
    accent: { DEFAULT: 'var(--accent)', strong: 'var(--accent-strong)', soft: 'var(--accent-soft)' }, 'on-accent': 'var(--on-accent)',
    maas: { DEFAULT: 'var(--maas)', soft: 'var(--maas-soft)' }, 'on-maas': 'var(--on-maas)',
    warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)', line: 'var(--warn-line)' }, scrim: 'var(--scrim)',
  },
  fontFamily: { display: ['var(--font-display)', 'sans-serif'], sans: ['var(--font-sans)', 'sans-serif'] },
  borderRadius: { lg: '8px', xl: '12px', '2xl': '16px', '3xl': '24px' },
  boxShadow: { card: 'var(--shadow-card)', float: 'var(--shadow-float)', fab: 'var(--shadow-fab)', ring: 'var(--focus-ring)' },
}
// globals.css: paste tokens.css (from this system) and toggle dark with <html data-theme="dark"> or a prefers-color-scheme block that copies the dark values.
```

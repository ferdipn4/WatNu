# Card

The surface everything else is built on: `surface-raised` on a 1px `line` hairline, `radius-lg`, 16px padding, the faint `shadow-card` (none in dark). EventCard and OrganizerCard are Cards with `tight` padding; the promo card, the stats card and the upload area are Cards with a tone and plain children.

- `tone="accent"`: the promo card on the event detail ("10% off with WatNu"); its text is `accent` and `ink-muted`, it opens the QR sheet.
- `tone="maas"`: the organizer stats card (the one `stat` number, a caption above, the delta beside it) and the "Translated from Dutch" note.
- `tone="upload"`: the dashed drop area on create step 1; centred content, `radius-xl`.
- `tone="sunken"`: quiet grouping with no border. Never nest a raised card in a raised card.
- A Card with `onClick` renders as a `<button>` and shows the focus ring; otherwise a `<div>` (or `as="article"`).
- Provide: `children`; optional `tone`, `tight`, `as`, `onClick`.

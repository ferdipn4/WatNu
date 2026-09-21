# EventCard

The row every list is made of: time on the left in the display face, then title, "location · organizer", the category tag and (when set) Newcomers welcome; price or the Free tag top-right, the bookmark bottom-right. With an `image` — the organizer's uploaded poster, by default — the card is vertical: the image on top at 16:9, edge to edge under the card's own radius, then the same row. Without one it stays the 92px compact row; a list mixes both freely.

- The image is whatever the organizer uploaded (the poster or screenshot the AI read), cropped `object-fit: cover` to 16:9; the organizer can swap it on the review form. No image → no placeholder, no monogram: the compact card.

- The whole card opens the event; the bookmark is its own target and stops propagation. `saved` fills the bookmark in `accent`.
- `price` 0/null/undefined renders the maas **Free** tag; a number renders "€8" in `body-strong`. No "€0", no "from".
- `time` is 24-hour ("19:30"); `endTime` shows as "–23:00" under it in `caption`. No AM/PM, no "o'clock".
- Cards stack with 12px gaps under a day header (Today, Tomorrow, then the weekday name). Never show the date on the card — the header carries it.
- Pass `onSave={null}` for a read-only preview (the card shown under "Before you publish").
- Provide: `title`, `time`, `location`, `organizer`, `category`; optional `endTime`, `price`, `newcomers`, `saved`, `onSave`, `onClick`.

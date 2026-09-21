# Icon

Stroke icons on a 24px grid, 1.75px stroke, round caps and joins, `currentColor`. The bundle carries the 29 glyphs the five screens need; in the Next.js build use `lucide-react` with the same names (it has all of them at the same stroke) rather than copying these paths.

- Sizes: 16 inside tags, 20 in buttons and facts, 24 in the tab bar and top bars, 28 in the + button and upload area.
- The bookmark and the star are the two icons that fill: bookmark when saved / My WatNu active, star always (it is the WatNu mark).
- Decorative by default (`aria-hidden`); pass `title` for an accessible name when the icon stands alone.
- No emoji anywhere in the UI — organizers' posters have plenty, the AI strips them.
- Provide: `name`; optional `size`, `filled`, `title`.

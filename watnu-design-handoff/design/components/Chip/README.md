# Chip

Two sizes, one shape: `md` is the tappable filter pill on Home and in the directory, `sm` is the static tag on cards. Selected filters fill with `accent` and `on-accent`; unselected sit on `surface-raised` with a `line` border.

- The Home filter row is one horizontally scrolling `.wn-chip-row`: the three quick filters (Today, Weekend, Free), a 1px separator, then the six categories in this fixed order: Sport, Party, Café & Food, Culture, Study & Career, Social. Filters combine (AND across groups, OR inside categories).
- Tags carry `tone`: neutral for the category, `maas` for Free and Newcomers welcome, `accent` for a promo, `warn` for "check", `ink` only over an image. Never more than three tags on a card.
- Filter chips are `<button aria-pressed>`; tags are plain `<span>`.
- Provide: `label`, `selected`, `onClick` (md); `label`, `tone`, optional `icon` (sm).

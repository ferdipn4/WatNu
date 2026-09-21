# OrganizerCard

A directory row: the logo tile, name, "type · category", and a small Follow button (or a chevron when following is not the point of the list).

- `type` picks the monogram tile when there is no `logo`: associations on `accent-soft`, cafés on `surface-sunken`, clubs on `ink`, venues on `maas-soft`. Two letters from the name, or pass `initials`.
- Following is local (no accounts): the toggle flips to a `secondary` "Following" with a check. Tapping the row opens the profile; the button stops propagation.
- Type labels are fixed strings: "Student association", "Café", "Club", "Venue".
- Provide: `name`, `type`, `category`; optional `initials`, `logo`, `following`, `onFollow` (null hides the button and shows a chevron), `onClick`.

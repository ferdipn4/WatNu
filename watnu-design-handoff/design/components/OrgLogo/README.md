# OrgLogo

An organizer's logo, or — most of the time, since organizers upload nothing but a poster — a two-letter monogram tile in the display face, coloured by type: associations `accent` on `accent-soft`, cafés `ink` on `surface-sunken`, clubs `surface` on `ink`, venues `maas` on `maas-soft`.

- Three sizes: `sm` 28px (the followed-organizers strip on My WatNu), `md` 44px (rows, the detail screen), `lg` 72px (the profile header). Square with `radius-md`; `round` only in the avatar strip.
- With `src` the tile shows the image, `object-fit: cover`, same radius. Organizers set a logo from their profile later; the monogram is never a placeholder to apologise for.
- Provide: `name` (for the initials and the accessible label); optional `initials`, `type`, `src`, `size`, `round`.

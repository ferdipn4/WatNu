# TabBar

The bottom bar on every top-level screen: four equal slots — This week, Organizers, the + Create button, My WatNu — 64px tall plus the device's bottom safe area, `surface-raised` on a `line` hairline.

- The + is a 56px `accent` disc that rises 16px above the bar with the `shadow-fab` glow and a 3px `surface-raised` ring; it is the only shadowed control in the app. Its label reads "Create".
- The active tab is `accent` (the bookmark icon fills when My WatNu is active); the others are `ink-muted`. Labels are 11px `label` style, always visible.
- The bar is fixed; screens pad their scroll area 96px at the bottom so the last card clears it. It disappears inside the create flow and on the event detail screen (both have a back button instead).
- Provide: `active` ("week" | "organizers" | "create" | "mine"), `onChange`.

# Button

One `primary` per screen, for the thing the screen is for (Publish, Follow, Show QR); everything else is `secondary`, `outline` or `ghost`. Labels are a verb in sentence case: "Add to calendar", never "OK".

- `size="lg" full` for the screen's main action at the bottom of a flow (Publish, Follow on a profile). `size="sm"` inside cards and panels (Follow on an organizer row, the answers in a warning panel).
- `outline` is for buttons that sit on a tinted ground (the amber and maas panels), where a sunken fill would look muddy.
- `ghost` is text-only in accent; use it for the secondary path in a flow ("Paste text instead").
- `iconOnly round onImage` for the back, share and bookmark buttons over the event image; pass `aria-label`.
- Pressed: primary darkens to `accent-strong` (lightens in dark); every button scales to 98%. Focus: the `focus-ring` shadow.
- Provide: `children` (the label), `onClick`; optionally `icon` (an Icon name), `href` to render a link.

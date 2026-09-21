# WarningPanel

The "Before you publish" checks, and any other note that needs a decision. Three tones, one shape: an icon disc, a small kicker, a one-line fact as the title, a sentence of detail, optional actions.

- `conflict` (amber, warning icon, kicker "Busy slot"): the title is a count — "3 other events Thursday evening, 2 of them Sport". Never a judgement ("bad time").
- `duplicate` (amber, copy icon, kicker "Possible duplicate"): the title is the question — "Is this the same as "Board Game Evening"?" — the body names the other event's organizer, day and time, and the actions answer it: outline "Yes, same event", primary "No, different".
- `suggestion` (maas, bulb icon, kicker "Suggestion"): a better option with the number that backs it — "Wednesday is quieter: 1 event" — and one outline action that applies it.
- Panels never block: Publish stays enabled below them. Amber panels are `role="alert"`.
- Provide: `tone`, `title`; optional `children` (body), `actions` (sm buttons: `outline` on tints, one `primary` at most), `kicker`, `icon`.

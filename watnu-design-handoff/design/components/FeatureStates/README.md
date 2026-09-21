# Feature states

Every control that needs the backend reads its flag from `features.ts` (`live` · `local` · `soon` · `off`) and renders one of four ways, so the frontend always says what it can do: **live** looks and works as designed; **local** works on this phone with a one-line hint where the data lives; **soon** stays in place, dashed and muted with a Soon tag (Button `soon`, Chip tone `soon`, WarningPanel tone `soon`), and tapping shows the info Toast "Not in this version yet — coming soon"; **off** is not rendered at all.

- Set the flags from what the backend really has before each release; the screens in this system show every feature as `live`.
- A `soon` control keeps its exact place and size so the layout does not shift when it goes live.
- Never fake a result (no placeholder numbers, no "0 redeemed"); a stats card whose feature is `soon` is the dashed panel instead.

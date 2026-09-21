# Toast

The one transient message: a single line above the tab bar (`bottom: 104px`), 4 seconds, then gone; never two at once, never a stack. `done` is maas with a check ("Published — it's live for everyone in Maastricht", "Saved to My WatNu"); `info` is ink with a clock and is what a `soon` control shows when tapped ("Not in this version yet — coming soon").

- One optional text action, underlined ("Undo"). No close button — it leaves on its own.
- Never use a toast for errors that need a decision; those are a WarningPanel in place.
- Provide: `children` (one line); optional `tone`, `icon`, `action`, `onAction`.

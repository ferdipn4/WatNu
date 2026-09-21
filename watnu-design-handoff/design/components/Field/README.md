# Field

Every input in the create flow and the directory search. Label in `label` style above, a 44px control on `surface-raised` with a `line` border, `radius-md`; a hint below when there is something to say.

- `missing`: the AI could not read this from the poster. The control turns `warn-soft` with a 1.5px `warn-line` border and the hint reads "Not found on the poster — please add it" in `warn`. The colour never stands alone: the hint text and the warning icon carry the meaning too.
- `trailing` puts a note right of the label — "AI guess" in maas for a field the AI inferred rather than read (the category).
- `kind="select"` is a button that opens a sheet of options (the six categories); `kind="search"` is the sunken pill with a search icon; `kind="switch"` is a label row with a 46×28 toggle (Newcomers welcome); `kind="textarea"` is 88px min, `body` weight.
- Two short fields share a row with `.wn-grid-2` (Start / End, Date / Price).
- Provide: `label`, `value`, `onChange`; optional `kind`, `placeholder`, `missing`, `hint`, `trailing`, `checked` (switch).

# Visual direction

The look (UI, not UX) the owner chose on 2026-11-02. The layout itself follows
[00-layout-reference.md](00-layout-reference.md).

**Sources.** Two Pinterest pins: a blurred, grainy sunset gradient
(https://ca.pinterest.com/pin/610448924533902066/) and flat pink with grainy coral blobs and
four-point sparkles (https://ca.pinterest.com/pin/313211349108071545/). Copies for local
viewing are in `references/visual/` (gitignored: third-party images, never committed).

## Rules

- **Grain and warm gradients.** Yellow, orange, coral, pink and a touch of violet, with a
  fractal-noise grain on top. The colors are tokens in `src/app/src/styles.css`
  (`--sun-*`, `--grain`).
- **Full sunset on the signed-out screens** (`bg-sunset`), with sparkles in white and in the
  primary plum. **Signed-in screens stay calm:** plum cream, the same grain, a faint glow at
  the top, so figures stay easy to read.
- **Surfaces are flat.** Cream cards with a thin border. No shadows: the shadow scale is
  removed from the Tailwind theme, so a shadcn component added later gets none either.
- **Incomes are green** (`--income`), expenses in the text colour; red never marks an
  amount.
- **Primary is a dusk plum** (`oklch(0.48 0.17 320)`, dark mode `oklch(0.76 0.12 320)`),
  with its tints (secondary, accent) at the same hue (2026-11-03). Text, muted text,
  borders, field borders, the focus outline and the backgrounds are plum tints too (hue
  320): the page is a plum cream (`oklch(0.965 0.014 320)`), cards a near white. Muted
  text is 5.6:1 on the page; field borders are at least 3:1 in both themes. Only white
  button text, the error red and the sunset gradients sit off that hue. White text on it is
  7.2:1 and plum text on cream 6.9:1. It replaced a rose that sat 0.05 from the error red
  in perceptual distance; plum sits 0.21 away, so red is left to errors and deletes.
  Yellow was ruled out: yellow text on cream is 1.4:1. The favicon follows (`#853397` on
  `#f8e8fb`).
- **Inconsolata as the accent font**, uppercase and spaced: the wordmark and card titles.
  Button text is set in Inconsolata too, uppercase (2026-11-03).
- **Focus** is a 2px outline in the text colour (dark plum, or the light text in dark mode)
  with a 2px gap, on every control. Never a red: red means an error.
- **Fields** (inputs, selects, pickers, checkboxes) share one control style
  (`fieldControl` in `ui/field.tsx`) and a 4px radius (`--radius-field`). **Buttons** take
  the card radius by default (`rounded-xl` in `ui/button.tsx`); pills stay for the header
  switchers.
- **Toasts** appear at the top right (top, full width on phones). **No helper text,
  taglines, legends or secondary labels**: when a screen needs them to make sense, the
  label or the layout changes instead.
- **Punctuation:** no space before ":" "?" "!" or ";", French included, so a mark never
  wraps alone. **Confirmations** read "Supprimer {name}", then "Cette action est
  irréversible.", a red button and "Annuler" (`ConfirmDialog`).
- **Icon actions** (`IconButton`, `IconLink`, `IconAnchor`) share one 32px target and a
  20px icon, in the primary colour. Icons inside text buttons follow the text size.
  Amounts will use it too (tabular figures line up). Body text stays Nunito.
- **Every signed-out card title has an icon** in the primary plum: log-in, key, lock, mail,
  shield-check (`AuthShell`'s `icon` prop).
- **The sparkle** (`Sparkle` component) is decoration only, always `aria-hidden`.

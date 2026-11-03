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
  primary red. **Signed-in screens stay calm:** pale pink, the same grain, a faint glow at
  the top, so figures stay easy to read.
- **Surfaces are flat.** Cream cards with a thin border. No shadows: the shadow scale is
  removed from the Tailwind theme, so a shadcn component added later gets none either.
- **Incomes are green** (`--income`), expenses in the text colour; red never marks an
  amount.
- **Primary is the sparkle red.** White text on it and red text on cream both pass WCAG AA.
- **Inconsolata as the accent font**, uppercase and spaced: the wordmark and card titles.
  Amounts will use it too (tabular figures line up). Body text stays Nunito.
- **Every signed-out card title has an icon** in the primary red: log-in, key, lock, mail,
  shield-check (`AuthShell`'s `icon` prop).
- **The sparkle** (`Sparkle` component) is decoration only, always `aria-hidden`.

# Visual direction

The look chosen by the owner on 2026-11-02, from two Pinterest pins: a blurred grainy sunset gradient and flat pink with coral blobs and four-point sparkles. Tokens live in `src/app/src/styles.css`.

## Rules

- **Grain and warm gradients.** Yellow, orange, coral, pink, a touch of violet, with fractal-noise grain. Full sunset on signed-out screens; signed-in screens stay calm (plum cream, the same grain) so figures read easily.
- **Flat surfaces.** Cream cards with a thin border, no shadows (the shadow scale is removed from the theme, so added shadcn components get none).
- **Primary is a dusk plum** (hue 320), with tints for text, borders, focus and backgrounds. It replaced a rose that sat too close to the error red; red is left to errors and deletes. Yellow was ruled out: yellow text on cream is 1.4:1.
- **Colour carries meaning:** incomes green, expenses the text colour, red never marks an amount, pending blue, owed amber (pending wins on a row that is both).
- **Inconsolata** is the accent font (uppercase, spaced): wordmark, card titles, buttons, amounts. Body text is Nunito. Both self-hosted.
- **Focus** is a 2px outline in the text colour with a 2px gap, never red.
- **Fields** share one control style and a 4px radius; buttons take the card radius; pills stay for the header switchers. Fields and outline controls share one border, set softer than 3:1 by the author's choice (2026-11-05).
- **Toasts** top right (top, full width on phones).
- **Icon actions** share a 32px target and a 20px icon in the primary colour. The sparkle is decoration, `aria-hidden`.

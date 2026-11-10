// Category colours (spec 12): stored as #rrggbb, reasoned about in OKLCH so a variation
// keeps the hue. Conversions follow Björn Ottosson's OKLab definition.

export type Oklch = { l: number; c: number; h: number }

type Rgb = [number, number, number]

const toLinear = (x: number) =>
  x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
const fromLinear = (x: number) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055

function hexToLinear(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    toLinear(v / 255),
  ) as Rgb
}

function linearToHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((v) => {
        const byte = Math.round(fromLinear(Math.min(1, Math.max(0, v))) * 255)
        return byte.toString(16).padStart(2, '0')
      })
      .join('')
  )
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ]
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToLinear(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363015264 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h }
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** Out of sRGB, chroma drops until it fits; lightness and hue stay. */
export function oklchToHex(color: Oklch): string {
  let c = color.c
  while (c > 0 && !inGamut(oklchToLinear({ ...color, c }))) c -= 0.005
  return linearToHex(oklchToLinear({ ...color, c: Math.max(0, c) }))
}

function luminance(hex: string) {
  const [r, g, b] = hexToLinear(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** How far apart two colours look (OKLab, scaled so 1 is just noticeable). */
export function distance(a: string, b: string) {
  const [x, y] = [hexToOklch(a), hexToOklch(b)]
  const rad = Math.PI / 180
  return (
    Math.hypot(
      x.l - y.l,
      x.c * Math.cos(x.h * rad) - y.c * Math.cos(y.h * rad),
      x.c * Math.sin(x.h * rad) - y.c * Math.sin(y.h * rad),
    ) * 100
  )
}

/** White when it reaches 3:1 on the circle (WCAG non-text contrast), else a dark shade. */
export function iconColor(background: string): string {
  if (contrast('#ffffff', background) >= 3) return '#ffffff'
  const { c, h } = hexToOklch(background)
  return oklchToHex({ l: 0.3, c: Math.min(c, 0.08), h })
}

const L_STEP = 0.06
const H_STEP = 12
const L_OFFSETS = [0, 1, -1, 2, -2, 3, -3]
// One hue step either way: two send greens and yellows toward olive.
const H_OFFSETS = [0, 1, -1]

/** Lightness and hue around the parent, in sRGB, minus the parent itself and browns. */
function candidates(base: Oklch) {
  const found: Array<string> = []
  for (const dl of L_OFFSETS)
    for (const dh of H_OFFSETS) {
      const l = base.l + dl * L_STEP
      const h = (base.h + dh * H_STEP + 360) % 360
      if (l < 0.3 || l > 0.92 || muddy(l, h)) continue
      const hex = oklchToHex({ ...base, l, h })
      if (found.every((other) => distance(hex, other) >= 3)) found.push(hex)
    }
  return found.filter((hex) => distance(hex, oklchToHex(base)) >= 4)
}

// Oranges and yellows turn brown when darkened, yellow-greens olive unless very light.
const muddy = (l: number, h: number) =>
  (h > 35 && h < 125 && l < 0.75) || (h >= 95 && h < 125 && l < 0.86)

const orders = new Map<string, Array<string>>()

/** Each next sibling as far as possible from the ones before it, so neighbours differ. */
function siblingOrder(parent: string) {
  const known = orders.get(parent)
  if (known) return known
  const left = candidates(hexToOklch(parent))
  const order = left.splice(0, 1)
  while (left.length) {
    const spread = left.map((hex) =>
      Math.min(...order.map((picked) => distance(hex, picked))),
    )
    const best = spread.indexOf(Math.max(...spread))
    order.push(...left.splice(best, 1))
  }
  orders.set(parent, order)
  return order
}

/** The colour of the sibling at `index`: near the parent, never the parent's own. */
export function siblingVariation(parent: string, index: number): string {
  const order = siblingOrder(parent)
  return order[index % order.length] ?? parent
}

export type TagColors = {
  light: { background: string; text: string }
  dark: { background: string; text: string }
}

/**
 * A tag's soft pill from any hex, like a Gmail label (spec 22): the hue kept, a pale tint
 * with dark text, or in dark mode a deep tint with pale text. Both pairs read at 4.5:1
 * whatever the colour chosen.
 */
export function tagColors(hex: string): TagColors {
  const { c, h } = hexToOklch(hex)
  const shade = (l: number, max: number) =>
    oklchToHex({ l, c: Math.min(c, max), h })
  return {
    light: { background: shade(0.94, 0.06), text: shade(0.38, 0.12) },
    dark: { background: shade(0.32, 0.06), text: shade(0.88, 0.09) },
  }
}

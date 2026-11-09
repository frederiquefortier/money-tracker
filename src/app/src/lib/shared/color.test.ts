import { describe, expect, it } from 'vitest'
import {
  contrast,
  distance,
  hexToOklch,
  iconColor,
  oklchToHex,
  siblingVariation,
} from '#/lib/shared/color'

describe('OKLCH and hex', () => {
  it('round-trips a colour', () => {
    for (const hex of ['#c0392b', '#2255aa', '#7a7a7a', '#ffffff', '#000000'])
      expect(oklchToHex(hexToOklch(hex))).toBe(hex)
  })

  it('brings an out-of-gamut colour back into sRGB, keeping the hue', () => {
    const hex = oklchToHex({ l: 0.62, c: 0.4, h: 148 })
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(hexToOklch(hex).h).toBeCloseTo(148, -1)
  })
})

describe('iconColor', () => {
  it('draws white on a mid-tone circle', () => {
    expect(iconColor(oklchToHex({ l: 0.62, c: 0.16, h: 255 }))).toBe('#ffffff')
  })

  it('draws a dark shade of the hue on a light circle, at 3:1 or more', () => {
    const light = oklchToHex({ l: 0.85, c: 0.1, h: 88 })
    const icon = iconColor(light)
    expect(icon).not.toBe('#ffffff')
    expect(contrast(icon, light)).toBeGreaterThanOrEqual(3)
  })
})

describe('siblingVariation', () => {
  const parents = ['#c30839', '#ffcc00', '#0754c6', '#132e7f', '#8bd737']
  const siblingsOf = (parent: string) => [
    ...new Set(
      Array.from({ length: 30 }, (_, i) => siblingVariation(parent, i)),
    ),
  ]

  it('gives siblings colours apart from each other and from the parent', () => {
    for (const parent of parents) {
      const siblings = siblingsOf(parent)
      expect(siblings.length).toBeGreaterThanOrEqual(3)
      for (const [i, a] of siblings.entries()) {
        expect(distance(a, parent)).toBeGreaterThanOrEqual(4)
        for (const b of siblings.slice(i + 1))
          expect(distance(a, b)).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('never darkens a yellow or an orange into brown', () => {
    for (const sibling of siblingsOf('#ffcc00')) {
      const { l, h } = hexToOklch(sibling)
      if (h > 35 && h < 125) expect(l).toBeGreaterThanOrEqual(0.74)
    }
  })

  it('repeats only after every distinct colour is used', () => {
    const siblings = siblingsOf('#c30839')
    expect(siblingVariation('#c30839', siblings.length)).toBe(siblings[0])
  })
})

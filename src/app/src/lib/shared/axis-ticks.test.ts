import { describe, expect, it } from 'vitest'
import { axisTicks } from '#/lib/shared/axis-ticks'

describe('axisTicks', () => {
  it('takes the smallest round step giving at most six lines, without forcing 0', () => {
    expect(axisTicks(150_000, 370_000)).toEqual([
      150_000, 200_000, 250_000, 300_000, 350_000, 400_000,
    ])
    expect(axisTicks(-80_000, 160_000)).toEqual([-100_000, 0, 100_000, 200_000])
  })

  it('works for small and flat figures', () => {
    expect(axisTicks(0, 36_000)).toEqual([0, 10_000, 20_000, 30_000, 40_000])
    expect(axisTicks(500, 500)).toEqual([450, 475, 500, 525, 550])
  })

  it('takes fewer lines when asked', () => {
    expect(axisTicks(0, 4900, 5)).toEqual([0, 2000, 4000, 6000])
    expect(axisTicks(0, 76_000, 5)).toEqual([0, 20_000, 40_000, 60_000, 80_000])
    expect(axisTicks(-900, 3000, 5)).toEqual([-1000, 0, 1000, 2000, 3000])
  })
})

import { describe, expect, it } from 'vitest'
import { axisTicks } from '#/lib/dashboard/axis-ticks'

describe('axis ticks', () => {
  it('steps by a round figure past the largest value', () => {
    expect(axisTicks([4900, 2300])).toEqual([0, 2000, 4000, 6000])
    expect(axisTicks([76_000])).toEqual([0, 20_000, 40_000, 60_000, 80_000])
  })

  it('goes below zero when a value does', () => {
    expect(axisTicks([3000, -900])).toEqual([-1000, 0, 1000, 2000, 3000])
  })

  it('draws a lone zero when there is nothing', () => {
    expect(axisTicks([])).toEqual([0])
  })
})

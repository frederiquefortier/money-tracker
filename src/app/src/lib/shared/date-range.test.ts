import { describe, expect, it } from 'vitest'
import { fromRange, toRange } from '#/lib/shared/date-range'

describe('toRange', () => {
  it('reads no start as no dates', () => {
    expect(toRange(null, null)).toBeNull()
    expect(toRange(null, '2026-05-20')).toBeNull()
  })

  it('reads a start alone as one day', () => {
    expect(toRange('2026-05-12', null)).toEqual({
      start: '2026-05-12',
      end: '2026-05-12',
    })
  })

  it('keeps a start and an end', () => {
    expect(toRange('2026-05-10', '2026-05-20')).toEqual({
      start: '2026-05-10',
      end: '2026-05-20',
    })
  })
})

describe('fromRange', () => {
  it('stores no dates for no range', () => {
    expect(fromRange(null)).toEqual({ startsOn: null, endsOn: null })
  })

  it('stores one day without an end', () => {
    expect(fromRange({ start: '2026-05-12', end: '2026-05-12' })).toEqual({
      startsOn: '2026-05-12',
      endsOn: null,
    })
  })

  it('stores both ends of a longer range', () => {
    expect(fromRange({ start: '2026-05-10', end: '2026-05-20' })).toEqual({
      startsOn: '2026-05-10',
      endsOn: '2026-05-20',
    })
  })
})

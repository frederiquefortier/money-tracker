import { describe, expect, it } from 'vitest'
import {
  annualChangeOver,
  changeOver,
  periodChanges,
  monthsBack,
  parseRange,
  pointsInRange,
} from '#/lib/net-worth/net-worth-range'

describe('monthsBack', () => {
  it('crosses years', () => {
    expect(monthsBack('2026-02', 3)).toBe('2025-11')
    expect(monthsBack('2026-11', 24)).toBe('2024-11')
  })
})

describe('pointsInRange', () => {
  const points = [
    '2023-12-31',
    '2024-01-31',
    '2025-10-31',
    '2025-11-30',
    '2026-11-16',
  ].map((date) => ({ date, values: { total: '1' } }))
  const dates = (range: Parameters<typeof pointsInRange>[1]) =>
    pointsInRange(points, range, '2026-11-16').map((p) => p.date)

  it('starts at the month end N months or years back', () => {
    expect(dates('m1')).toEqual(['2026-11-16'])
    expect(dates('y1')).toEqual(['2025-11-30', '2026-11-16'])
    expect(dates('y3')).toHaveLength(5)
  })

  it('keeps everything for Tout', () => {
    expect(dates('all')).toHaveLength(5)
  })
})

const point = (date: string, total?: string | null) => ({
  date,
  values: total === undefined ? {} : { total },
})

describe('changeOver', () => {
  it('gives the amount and the percent over the first value, skipping gaps', () => {
    expect(
      changeOver(
        [point('a'), point('b', '800'), point('c', null), point('d', '1000')],
        'total',
      ),
    ).toEqual({ amount: '200.0000', percent: '25.000' })
  })

  it('reads a shrinking debt as a gain, and has no percent from zero', () => {
    expect(
      changeOver([point('a', '-400'), point('b', '-300')], 'total'),
    ).toEqual({ amount: '100.0000', percent: '25.000' })
    expect(
      changeOver([point('a', '0'), point('b', '50')], 'total')?.percent,
    ).toBeNull()
  })
})

describe('parseRange', () => {
  it('reads a preset and refuses the rest, the old custom range included', () => {
    expect(parseRange('y5')).toBe('y5')
    expect(parseRange('m3')).toBe('m3')
    expect(parseRange('y7')).toBeUndefined()
    expect(
      parseRange({ preset: 'custom', from: '2024-01', to: '2024-06' }),
    ).toBeUndefined()
  })
})

describe('periodChanges', () => {
  const months = (count: number) =>
    Array.from({ length: count }, (_, i) => {
      const end = new Date(Date.UTC(2024, i + 1, 0)).toISOString().slice(0, 10)
      return { date: end, values: { total: String(100 * i) } }
    })

  it('gives each month its change over a short range', () => {
    const changes = periodChanges(months(3), ['total'])
    expect(changes).toEqual([
      { date: '2024-02-29', values: { total: '100.0000' } },
      { date: '2024-03-31', values: { total: '100.0000' } },
    ])
  })

  it('gives each calendar year its change past a year and a half, from the first point', () => {
    const changes = periodChanges(months(30), ['total'])
    expect(changes.map((c) => [c.date, c.values.total])).toEqual([
      ['2024-12-31', '1100.0000'],
      ['2025-12-31', '1200.0000'],
      ['2026-06-30', '600.0000'],
    ])
  })

  it('counts a key with no item yet as 0, and empties one with a missing rate', () => {
    const changes = periodChanges(
      [
        { date: '2025-01-31', values: { total: '10' } },
        { date: '2025-02-28', values: { total: null, 'stack:debts': '-5' } },
      ],
      ['total', 'stack:debts'],
    )
    expect(changes[0].values).toEqual({
      total: null,
      'stack:debts': '-5.0000',
    })
  })
})

describe('annualChangeOver', () => {
  it('gives the amount per year and the compounded percent, from the first value', () => {
    const change = annualChangeOver(
      [
        point('2020-12-31', '0'),
        point('2021-01-01', '1000'),
        point('2023-01-01', '1210'),
      ],
      'total',
    )
    expect(change?.perYearFrom).toBe('2021-01-01')
    expect(Number(change?.amount)).toBeCloseTo(105, 0)
    expect(Number(change?.percent)).toBeCloseTo(10, 1)
  })

  it('has no percent when an end is not positive, and is the plain change under a year', () => {
    expect(
      annualChangeOver(
        [point('2021-01-01', '-500'), point('2023-01-01', '1000')],
        'total',
      )?.percent,
    ).toBeNull()
    expect(
      annualChangeOver(
        [point('2025-01-31', '800'), point('2025-06-30', '1000')],
        'total',
      ),
    ).toEqual({ amount: '200.0000', percent: '25.000' })
  })
})

import { describe, expect, it } from 'vitest'
import { at } from '#/lib/dashboard/dashboard-fixtures.test-utils'
import { missingMonths } from '#/lib/dashboard/missing-months'

const months = [
  at('2025-03', 'pay', '1.0000'),
  at('2025-06', 'pay', '1.0000'),
  at('2026-01', 'pay', '1.0000'),
  at('2026-02', 'rent', '-1.0000'),
]
const options = { firstMonth: '2025-03', today: '2026-04-10' }

describe('missing months', () => {
  it("finds a year's months without a transaction", () => {
    expect(
      missingMonths(months, { unit: 'year', year: '2025' }, options),
    ).toEqual([
      '2025-04',
      '2025-05',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
    ])
  })

  it('never counts this month, nor the months to come', () => {
    expect(
      missingMonths(months, { unit: 'year', year: '2026' }, options),
    ).toEqual(['2026-03'])
  })

  it('starts at the first month on record on everything', () => {
    expect(
      missingMonths(months, { unit: 'all', year: '2026' }, options)[0],
    ).toBe('2025-04')
  })
})

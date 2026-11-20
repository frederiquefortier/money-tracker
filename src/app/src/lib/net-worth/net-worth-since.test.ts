import { describe, expect, it } from 'vitest'
import { changeSinceStart } from '#/lib/net-worth/net-worth-since'

const point = (date: string, total?: string | null) => ({
  date,
  values: total === undefined ? {} : { total },
})
describe('changeSinceStart', () => {
  it('gives the plain change, the multiple and the average per year since the first value', () => {
    const since = changeSinceStart(
      [
        point('2020-12-31', '0'),
        point('2021-01-01', '1000'),
        point('2023-01-01', '3000'),
      ],
      'total',
    )
    expect(since).toMatchObject({
      change: { amount: '2000.0000', percent: null },
      multiple: '3.000',
      since: '2021-01-01',
    })
    expect(Number(since?.perYear)).toBeCloseTo(1000, -1)
  })

  it('has no average per year under a year, and no multiple from a debt', () => {
    expect(
      changeSinceStart(
        [point('2025-01-31', '800'), point('2025-06-30', '1000')],
        'total',
      )?.perYear,
    ).toBeNull()
    expect(
      changeSinceStart(
        [point('2021-01-01', '-500'), point('2023-01-01', '1000')],
        'total',
      )?.multiple,
    ).toBeNull()
  })
})

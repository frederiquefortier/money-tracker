import { describe, expect, it } from 'vitest'
import type { CategoryKind } from '#/lib/categories/category'
import {
  dailySpending,
  heatLevel,
  heatSteps,
} from '#/lib/dashboard/daily-spending'

const kindOf = new Map<string, CategoryKind>([
  ['food', 'expense'],
  ['pay', 'income'],
  ['etf', 'investment'],
])
const line = (
  occurredOn: string,
  categoryId: string,
  amount: string | null,
) => ({
  occurredOn,
  categoryId,
  amount,
})

describe('daily spending', () => {
  it('adds up each day from expense categories only, a refund lowering it', () => {
    expect(
      dailySpending(
        [
          line('2026-03-02', 'food', '-40.0000'),
          line('2026-03-02', 'food', '5.0000'),
          line('2026-03-02', 'pay', '1000.0000'),
          line('2026-03-01', 'etf', '-500.0000'),
          line('2026-03-01', 'food', '-12.5000'),
        ],
        kindOf,
      ),
    ).toEqual([
      { day: '2026-03-01', spent: '12.5000' },
      { day: '2026-03-02', spent: '35.0000' },
    ])
  })

  it('gives a day with a missing rate no figure, and drops a day that nets to nothing', () => {
    expect(
      dailySpending(
        [
          line('2026-03-03', 'food', null),
          line('2026-03-04', 'food', '-10.0000'),
          line('2026-03-04', 'food', '10.0000'),
        ],
        kindOf,
      ),
    ).toEqual([{ day: '2026-03-03', spent: null }])
  })
})

describe('heat levels', () => {
  const days = [10, 20, 30, 40, 50, 60, 70, 1000].map((v, i) => ({
    day: `2026-01-0${i + 1}`,
    spent: String(v),
  }))
  const steps = heatSteps(days)

  it('cuts the year at its quartiles, so a large day does not flatten the rest', () => {
    expect(steps).toEqual([30, 50, 70, 1000])
    expect([0, 10, 35, 60, 900].map((v) => heatLevel(v, steps))).toEqual([
      0, 1, 2, 3, 4,
    ])
  })

  it('has no steps without spending', () => {
    expect(heatSteps([])).toEqual([])
  })
})

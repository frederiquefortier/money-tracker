import { describe, expect, it } from 'vitest'
import { categoryStacks } from '#/lib/dashboard/category-stacks'
import {
  at,
  categories,
  category,
} from '#/lib/dashboard/dashboard-fixtures.test-utils'

const year = { unit: 'year' as const, year: '2026' }
const months = [
  at('2026-01', 'rent', '-1000.0000'),
  at('2026-01', 'home', '-100.0000'),
  at('2026-01', 'fun', '-300.0000'),
  at('2026-02', 'misc', '-100.0000'),
]

describe('category stacks', () => {
  it('stacks each bucket by group, a sub-category in its parent, largest first', () => {
    const stacks = categoryStacks(months, categories, {
      period: year,
      buckets: ['2026-01', '2026-02'],
      kind: 'expense',
      picked: null,
    })
    expect(stacks.series.map((s) => [s.key, s.total])).toEqual([
      ['home', '1100.0000'],
      ['fun', '300.0000'],
      ['misc', '100.0000'],
    ])
    expect(stacks.rows[0].values).toEqual({
      home: '1100.0000',
      fun: '300.0000',
    })
    expect(stacks.total).toBe('1500.0000')
  })

  it('keeps only the ticked categories', () => {
    const stacks = categoryStacks(months, categories, {
      period: year,
      buckets: ['2026-01'],
      kind: 'expense',
      picked: new Set(['fun']),
    })
    expect(stacks.total).toBe('300.0000')
  })

  it('shows every group, without folding any into Autres', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      category(`g${i}`, 'expense'),
    )
    const stacks = categoryStacks(
      many.map((c, i) => at('2026-01', c.id, `-${10 - i}.0000`)),
      many,
      { period: year, buckets: ['2026-01'], kind: 'expense', picked: null },
    )
    expect(stacks.series).toHaveLength(10)
    expect(stacks.series.at(-1)).toMatchObject({ key: 'g9', total: '1.0000' })
  })
})

describe('stacks by need and want, or by category', () => {
  const options = {
    period: year,
    buckets: ['2026-01', '2026-02'],
    kind: 'expense' as const,
    picked: null,
  }

  it('splits needs, wants and the unmarked with their shares, a mark inherited from the parent', () => {
    const stacks = categoryStacks(months, categories, {
      ...options,
      view: 'necessity',
    })
    expect(stacks.series.map((s) => [s.key, s.total, s.share])).toEqual([
      ['need', '1100.0000', '73.333'],
      ['want', '300.0000', '20.000'],
      ['unclassified', '100.0000', '6.667'],
    ])
    expect(stacks.rows[0].values).toEqual({
      need: '1100.0000',
      want: '300.0000',
    })
  })

  it('splits by category as booked, largest first', () => {
    expect(
      categoryStacks(months, categories, {
        ...options,
        view: 'categories',
      }).series.map((s) => s.key),
    ).toEqual(['rent', 'fun', 'home', 'misc'])
  })
})

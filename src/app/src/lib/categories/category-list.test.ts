import { describe, expect, it } from 'vitest'
import type { Category, CategoryKind } from '#/lib/categories/category'
import {
  categoryChildren,
  frequentCategories,
} from '#/lib/categories/category-list'

const category = (
  id: string,
  name: string,
  {
    kind = 'expense',
    parentId = null,
    to = null,
  }: { kind?: CategoryKind; parentId?: string | null; to?: string | null } = {},
): Category => ({
  id,
  parentId,
  name,
  kind,
  icon: 'tag',
  iconIsAuto: true,
  color: '#aa3322',
  colorIsAuto: false,
  necessity: null,
  history: [],
  periods: [{ from: null, to }],
})

const categories = [
  category('food', 'Alimentation'),
  category('grocery', 'Épicerie', { parentId: 'food' }),
  category('cafe', 'Café', { parentId: 'food' }),
  category('old', 'Vieux', { to: '2026-01-01' }),
  category('salary', 'Salaire', { kind: 'income' }),
  category('rrsp', 'REER', { kind: 'investment' }),
]
const options = {
  kind: 'expense' as const,
  query: '',
  sort: 'name' as const,
  locale: 'fr',
  date: '2026-11-04',
}

const names = (map: ReturnType<typeof categoryChildren>['childrenOf']) =>
  Object.fromEntries(
    [...map].map(([parent, list]) => [String(parent), list.map((c) => c.id)]),
  )

describe('categoryChildren', () => {
  it('gives one kind’s active categories by parent', () => {
    const { childrenOf, open } = categoryChildren(categories, options)
    expect(names(childrenOf)).toEqual({
      null: ['food'],
      food: ['cafe', 'grocery'],
    })
    expect(open).toBeNull()
    expect(
      names(
        categoryChildren(categories, { ...options, kind: 'investment' })
          .childrenOf,
      ),
    ).toEqual({ null: ['rrsp'] })
  })

  it('keeps matches with their parents while searching, and opens them', () => {
    const { childrenOf, open } = categoryChildren(categories, {
      ...options,
      query: 'cafe',
    })
    expect(names(childrenOf)).toEqual({ null: ['food'], food: ['cafe'] })
    expect([...(open ?? [])].sort()).toEqual(['cafe', 'food'])
  })

  it('keeps the subcategories of a matching parent', () => {
    const { childrenOf } = categoryChildren(categories, {
      ...options,
      query: 'alim',
    })
    expect(names(childrenOf)).toEqual({
      null: ['food'],
      food: ['cafe', 'grocery'],
    })
  })
})

describe('frequentCategories', () => {
  it('keeps the ones still active, in order', () => {
    expect(
      frequentCategories(
        categories,
        ['old', 'grocery', 'salary'],
        '2026-11-04',
      ).map((c) => c.id),
    ).toEqual(['grocery', 'salary'])
  })
})

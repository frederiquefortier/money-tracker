import { describe, expect, it } from 'vitest'
import { filterMerchants, sortMerchants } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'

const categories: Partial<
  Record<string, { path: string; parent: string | null }>
> = {
  food: { path: 'Alimentation', parent: null },
  grocery: { path: 'Alimentation > Épicerie', parent: 'food' },
  home: { path: 'Logement', parent: null },
}
const tree = {
  pathOf: (id: string) => categories[id]?.path,
  parentOf: (id: string) => categories[id]?.parent,
}
const merchant = (
  name: string,
  defaultCategoryId: string | null,
): Merchant => ({
  id: name,
  name,
  defaultCategoryId,
  personId: null,
  transactionCount: 0,
})
const merchants = [
  merchant('Zoo Bistro', 'food'),
  merchant('Épicerie Tau', 'grocery'),
  merchant('Hydro Nord', 'home'),
  merchant('Librairie', null),
]
const names = (list: ReadonlyArray<Merchant>) => list.map((m) => m.name)

describe('sortMerchants', () => {
  it('sorts by name both ways, ignoring accents', () => {
    expect(
      names(
        sortMerchants(merchants, {
          sort: 'nameAsc',
          pathOf: tree.pathOf,
          locale: 'fr-CA',
        }),
      ),
    ).toEqual(['Épicerie Tau', 'Hydro Nord', 'Librairie', 'Zoo Bistro'])
    expect(
      names(
        sortMerchants(merchants, {
          sort: 'nameDesc',
          pathOf: tree.pathOf,
          locale: 'fr-CA',
        }),
      )[0],
    ).toBe('Zoo Bistro')
  })

  it('sorts by category path, with no category last', () => {
    expect(
      names(
        sortMerchants(merchants, {
          sort: 'category',
          pathOf: tree.pathOf,
          locale: 'fr-CA',
        }),
      ),
    ).toEqual(['Zoo Bistro', 'Épicerie Tau', 'Hydro Nord', 'Librairie'])
  })
})

describe('merchant filter', () => {
  it('keeps a category with its branch', () => {
    expect(names(filterMerchants(merchants, ['food'], tree))).toEqual([
      'Zoo Bistro',
      'Épicerie Tau',
    ])
    expect(names(filterMerchants(merchants, [], tree))).toHaveLength(4)
  })
})

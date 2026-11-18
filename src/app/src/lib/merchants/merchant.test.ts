import { describe, expect, it } from 'vitest'
import { sortMerchants } from '#/lib/merchants/merchant'
import type { Merchant } from '#/lib/merchants/merchant'

const paths: Partial<Record<string, string>> = {
  food: 'Alimentation',
  grocery: 'Alimentation > Épicerie',
  home: 'Logement',
}
const tree = { pathOf: (id: string) => paths[id] }
const merchant = (
  name: string,
  defaultCategoryId: string | null,
): Merchant => ({
  id: name,
  name,
  defaultCategoryId,
  aliases: [],
  suggestedCategoryId: null,
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

import { describe, expect, it } from 'vitest'
import { treeGuides, treeOrder } from './tree'

describe('treeOrder', () => {
  it('lists each item before its children, every level by name', () => {
    const items = [
      { id: 'c', parentId: 'a', name: 'Restaurants' },
      { id: 'b', parentId: 'a', name: 'Épicerie' },
      { id: 'd', parentId: null, name: 'Logement' },
      { id: 'a', parentId: null, name: 'Alimentation' },
      { id: 'e', parentId: 'gone', name: 'Orphelin' },
    ]
    expect(
      treeOrder(items, 'fr-CA').map(({ item, depth }) => [item.id, depth]),
    ).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 1],
      ['d', 0],
      ['e', 0],
    ])
  })
})

describe('treeGuides', () => {
  it('continues a line while a sibling follows, and ends it on the last', () => {
    // A, B (child), C (grandchild), D (child), E
    expect(treeGuides([0, 1, 2, 1, 0])).toEqual([
      { depth: 0, continues: [], last: false },
      { depth: 1, continues: [], last: false },
      { depth: 2, continues: [true], last: true },
      { depth: 1, continues: [], last: true },
      { depth: 0, continues: [], last: true },
    ])
  })
})

import { describe, expect, it } from 'vitest'
import type { Category } from '#/lib/categories/category'
import { archivedParents, archivedTree } from '#/lib/categories/category-tree'

const category = (
  id: string,
  name: string,
  parentId: string | null,
): Category => ({
  id,
  name,
  parentId,
  kind: 'expense',
  icon: 'tag',
  iconIsAuto: true,
  color: '#aa3322',
  colorIsAuto: false,
  necessity: null,
  history: [{ status: 'archived', effectiveOn: '2024-06-01', viaId: null }],
  periods: [],
})

const list = [
  category('m', 'Maison', null),
  category('e', 'Entretien', 'm'),
  category('p', 'Plomberie', 'e'),
  { ...category('t', 'Transport', null), history: [] },
  category('x', 'Taxi', 't'),
  category('a', 'Autobus', 't'),
]
const byId = new Map(list.map((c) => [c.id, c]))
const archived = list.filter((c) => c.history.length > 0)

describe('the archived tree', () => {
  it('keeps archived branches and starts one at the top under an active parent', () => {
    const tree = archivedTree(archived, byId, 'fr-CA')
    expect(tree.get(null)?.map((c) => c.id)).toEqual(['m', 'a', 'x'])
    expect(tree.get('m')?.map((c) => c.id)).toEqual(['e'])
    expect(tree.get('e')?.map((c) => c.id)).toEqual(['p'])
  })

  it('names the archived parents from the top down', () => {
    expect(
      archivedParents(category('p', 'Plomberie', 'e'), byId).map((c) => c.id),
    ).toEqual(['m', 'e'])
    expect(archivedParents(category('x', 'Taxi', 't'), byId)).toEqual([])
  })
})

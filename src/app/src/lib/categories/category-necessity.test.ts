import { describe, expect, it } from 'vitest'
import { necessitySource } from '#/lib/categories/category-necessity'

describe('necessitySource', () => {
  const byId = new Map(
    [
      { id: 's', parentId: null, necessity: 'need' as const },
      { id: 'm', parentId: 's', necessity: 'want' as const },
      { id: 'k', parentId: 'm', necessity: null },
      { id: 'l', parentId: null, necessity: null },
    ].map((c) => [c.id, c]),
  )

  it('finds the nearest marked parent', () => {
    expect(necessitySource('s', byId)).toMatchObject({
      id: 's',
      necessity: 'need',
    })
    expect(necessitySource('k', byId)).toMatchObject({
      id: 'm',
      necessity: 'want',
    })
  })

  it('finds nothing at the top or under an unmarked branch', () => {
    expect(necessitySource(null, byId)).toBeUndefined()
    expect(necessitySource('l', byId)).toBeUndefined()
  })
})

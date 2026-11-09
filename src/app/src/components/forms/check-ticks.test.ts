import { describe, expect, it } from 'vitest'
import { categoryTicks } from '#/components/forms/check-ticks'
import type { Category } from '#/lib/categories/category'

const category = (id: string, parentId: string | null = null): Category => ({
  id,
  parentId,
  name: id,
  kind: 'expense',
  icon: 'tag',
  iconIsAuto: true,
  color: '#888888',
  colorIsAuto: true,
  necessity: null,
  history: [],
  periods: [],
})

// Food > Groceries, Restaurants > Coffee, Lunch
const categories = [
  category('food'),
  category('groceries', 'food'),
  category('restaurants', 'food'),
  category('coffee', 'restaurants'),
  category('lunch', 'restaurants'),
]
const node = (id: string) => ({ id, label: id })

describe('categoryTicks', () => {
  it('shows the branch of a ticked category as implied', () => {
    const ticks = categoryTicks(categories, ['food'])
    expect(ticks.stateOf(node('coffee'))).toBe('implied')
  })

  it('unticks one sub-category and keeps the rest of the branch', () => {
    const ticks = categoryTicks(categories, ['food'])
    expect(ticks.toggle(node('coffee')).sort()).toEqual(['groceries', 'lunch'])
  })

  it('unticks a direct child of the ticked one', () => {
    const ticks = categoryTicks(categories, ['restaurants'])
    expect(ticks.toggle(node('lunch'))).toEqual(['coffee'])
  })

  it('ticking a parent drops the ticks below it', () => {
    const ticks = categoryTicks(categories, ['coffee', 'groceries'])
    expect(ticks.toggle(node('restaurants'))).toEqual([
      'groceries',
      'restaurants',
    ])
  })
})

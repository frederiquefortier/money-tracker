import type { Category, CategoryKind } from '#/lib/categories/category'
import type { Necessity } from '#/lib/categories/category-necessity'
import type { MonthAmount } from '#/lib/dashboard/dashboard'

// Invented categories and months for the dashboard's tests.

export function category(
  id: string,
  kind: CategoryKind,
  {
    parentId = null,
    necessity = null,
  }: { parentId?: string | null; necessity?: Necessity | null } = {},
): Category {
  return {
    id,
    parentId,
    name: id,
    kind,
    icon: 'tag',
    iconIsAuto: true,
    color: '#aa3322',
    colorIsAuto: false,
    necessity,
    history: [],
    periods: [{ from: null, to: null }],
  }
}

export const categories = [
  category('home', 'expense', { necessity: 'need' }),
  category('rent', 'expense', { parentId: 'home' }),
  category('fun', 'expense', { necessity: 'want' }),
  category('misc', 'expense'),
  category('etf', 'investment'),
  category('pay', 'income'),
]

export const at = (
  month: string,
  categoryId: string,
  amount: string | null,
): MonthAmount => ({
  month,
  categoryId,
  amount,
})

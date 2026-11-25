import { useStoredState } from '#/hooks/app/use-stored-state'
import { CATEGORY_SORTS } from '#/lib/categories/category'
import type { CategorySort } from '#/lib/categories/category'
import { oneOf } from '#/lib/shared/collections'

const parseSort = oneOf(CATEGORY_SORTS)

/** The order chosen on Catégories, which the transaction form's list follows too. */
export function useCategorySort() {
  return useStoredState<CategorySort>('categories.sort', 'nameAsc', parseSort)
}

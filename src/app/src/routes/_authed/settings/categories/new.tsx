import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryForm } from '#/components/categories/form/category-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import {
  DEFAULT_ICON,
  KINDS,
  isArchived,
  nextTopColor,
} from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'
import { useCategoriesPage } from '#/hooks/app/use-page-data'
import { oneOf } from '#/lib/shared/collections'

export const Route = createFileRoute('/_authed/settings/categories/new')({
  validateSearch: (search): { kind?: CategoryKind; parent?: string } => ({
    kind: oneOf(KINDS)(search.kind),
    parent: typeof search.parent === 'string' ? search.parent : undefined,
  }),
  staticData: { sheet: true },
  component: NewCategory,
})

function NewCategory() {
  const { t } = useTranslation()
  const categories = useCategoriesPage()
  const search = Route.useSearch()
  // The + on a row opens the form under that category.
  const parent = categories.find(
    (c) => c.id === search.parent && !isArchived(c),
  )

  return (
    <RouteSheet to="/settings/categories" title={t('categories.newTitle')}>
      <CategoryForm
        initial={{
          name: '',
          kind: parent?.kind ?? search.kind ?? 'expense',
          parentId: parent?.id ?? null,
          icon: DEFAULT_ICON,
          iconIsAuto: true,
          color:
            parent?.color ?? nextTopColor(categories, search.kind ?? 'expense'),
          colorIsAuto: parent !== undefined,
          necessity: null,
        }}
        categories={categories}
        savedText={t('categories.created')}
      />
    </RouteSheet>
  )
}

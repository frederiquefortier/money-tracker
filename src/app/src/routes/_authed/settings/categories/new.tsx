import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryForm } from '#/components/categories/category-form'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { DEFAULT_ICON, KINDS, isArchived, nextTopColor } from '#/lib/categories'
import type { Kind } from '#/lib/categories'
import { useCategoriesPage } from '#/lib/use-categories-page'

export const Route = createFileRoute('/_authed/settings/categories/new')({
  validateSearch: (search): { kind?: Kind; parent?: string } => ({
    kind: KINDS.find((k) => k === search.kind),
    parent: typeof search.parent === 'string' ? search.parent : undefined,
  }),
  component: NewCategory,
})

function NewCategory() {
  const { t } = useTranslation()
  const toast = useToast()
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
        }}
        categories={categories}
        onSaved={() => toast({ text: t('categories.created') })}
      />
    </RouteSheet>
  )
}

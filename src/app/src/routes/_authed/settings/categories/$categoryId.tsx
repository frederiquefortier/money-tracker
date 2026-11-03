import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryForm } from '#/components/categories/category-form'
import { CategoryHistory } from '#/components/categories/category-history'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { useCategoriesPage } from '#/lib/use-categories-page'

export const Route = createFileRoute(
  '/_authed/settings/categories/$categoryId',
)({
  component: EditCategory,
})

function EditCategory() {
  const { t } = useTranslation()
  const toast = useToast()
  const categories = useCategoriesPage()
  const { categoryId } = Route.useParams()
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return <Navigate to="/settings/categories" />

  return (
    <RouteSheet to="/settings/categories" title={t('categories.editTitle')}>
      <CategoryForm
        key={category.id}
        categoryId={category.id}
        initial={category}
        categories={categories}
        onSaved={() => toast({ text: t('categories.updated') })}
      >
        <CategoryHistory category={category} />
      </CategoryForm>
    </RouteSheet>
  )
}

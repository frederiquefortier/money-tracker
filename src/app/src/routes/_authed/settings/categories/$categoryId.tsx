import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryActions } from '#/components/categories/category-actions'
import { CategoryForm } from '#/components/categories/category-form'
import { CategoryHistory } from '#/components/categories/category-history'
import { RouteSheet } from '#/components/route-sheet'
import { isArchived } from '#/lib/categories'
import { categoryContext } from '#/lib/category-tree'
import { useCategoriesPage } from '#/lib/use-page-data'
import { indexById } from '#/lib/utils'
import { useFormatLocale } from '#/lib/use-locale'

export const Route = createFileRoute(
  '/_authed/settings/categories/$categoryId',
)({
  staticData: { sheet: true },
  component: EditCategory,
})

function EditCategory() {
  const { t } = useTranslation()
  const categories = useCategoriesPage()
  const locale = useFormatLocale()
  const { categoryId } = Route.useParams()
  const category = categories.find((c) => c.id === categoryId)
  if (!category)
    return <Navigate to="/settings/categories" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/categories"
      title={t('categories.editTitle')}
      actions={
        <CategoryActions
          category={category}
          {...categoryContext(categories, locale)(category)}
          onAddChild={isArchived(category) ? undefined : () => {}}
          placement="sheet"
        />
      }
    >
      <CategoryForm
        key={category.id}
        categoryId={category.id}
        initial={category}
        categories={categories}
        savedText={t('categories.updated')}
      >
        <CategoryHistory category={category} byId={indexById(categories)} />
      </CategoryForm>
    </RouteSheet>
  )
}

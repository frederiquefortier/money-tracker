import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryActions } from '#/components/categories/list/category-actions'
import { CategoryForm } from '#/components/categories/form/category-form'
import { CategoryHistory } from '#/components/categories/form/category-history'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { isArchived } from '#/lib/categories/category'
import { categoryContext } from '#/lib/categories/category-tree'
import { useCategoriesPage } from '#/hooks/app/use-page-data'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { indexById } from '#/lib/shared/collections'

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

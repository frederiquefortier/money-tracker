import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryActions } from '#/components/categories/category-actions'
import { CategoryForm } from '#/components/categories/category-form'
import { CategoryHistory } from '#/components/categories/category-history'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { categoryContext, isArchived } from '#/lib/categories'
import { useCategoriesPage } from '#/lib/use-categories-page'
import { useLocale } from '#/lib/use-locale'

export const Route = createFileRoute(
  '/_authed/settings/categories/$categoryId',
)({
  staticData: { sheet: true },
  component: EditCategory,
})

function EditCategory() {
  const { t } = useTranslation()
  const toast = useToast()
  const categories = useCategoriesPage()
  const locale = FORMAT_LOCALE[useLocale()]
  const { categoryId } = Route.useParams()
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return <Navigate to="/settings/categories" />

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
        onSaved={() => toast({ text: t('categories.updated') })}
      >
        <CategoryHistory category={category} />
      </CategoryForm>
    </RouteSheet>
  )
}

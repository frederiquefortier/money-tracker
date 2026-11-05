import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { ChoiceMenu } from '#/components/choice-menu'
import { FloatingAddButton } from '#/components/floating-add-button'
import { ListCard } from '#/components/list-card'
import { MerchantRow } from '#/components/merchants/merchant-row'
import { SearchField } from '#/components/search-field'
import { SettingsPage } from '#/components/settings-page'
import { SortMenu } from '#/components/sort-menu'
import { TreeGuides } from '#/components/tree-guides'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { categoryPath } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import {
  MERCHANT_SORTS,
  filterMerchants,
  merchantFilters,
  sortMerchants,
} from '#/lib/merchants'
import type { Merchant, MerchantFilter, MerchantSort } from '#/lib/merchants'
import { treeGuides } from '#/lib/tree'
import type { TreeGuide } from '#/lib/tree'
import { useLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'
import { foldForSearch } from '#/lib/utils'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'

export const Route = createFileRoute('/_authed/settings/merchants')({
  loader: async () => {
    const [merchants, categories] = await Promise.all([
      getMerchants(),
      getCategories(),
    ])
    return { merchants, categories }
  },
  component: Merchants,
})

const parseSort = (v: unknown) => MERCHANT_SORTS.find((s) => s === v)

function useCategoryTree(categories: ReadonlyArray<Category>) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const rows = new Map(
    categories.map((c) => [
      c.id,
      { path: categoryPath(c, byId), icon: c.icon, color: c.color },
    ]),
  )
  return {
    rows,
    pathOf: (id: string) => rows.get(id)?.path,
    nameOf: (id: string) => byId.get(id)?.name,
    parentOf: (id: string) => byId.get(id)?.parentId,
  }
}

/** A filter choice drawn like the Catégories tree: connectors, badge, name. */
function FilterOption({
  category,
  name,
  guide,
}: {
  category: { icon: string; color: string } | undefined
  name: string
  guide: TreeGuide | undefined
}) {
  return (
    <>
      {guide && <TreeGuides guide={guide} className="-my-1.5" />}
      {category && (
        <CategoryBadge icon={category.icon} color={category.color} size="sm" />
      )}
      <span className="truncate">{name}</span>
    </>
  )
}

function MerchantList({
  merchants,
  shown,
  tree,
}: {
  merchants: ReadonlyArray<Merchant>
  shown: ReadonlyArray<Merchant>
  tree: ReturnType<typeof useCategoryTree>
}) {
  const { t } = useTranslation()
  if (shown.length === 0)
    return (
      <p className="py-6 text-center text-muted-foreground">
        {t('common.noMatch')}
      </p>
    )
  return (
    <ListCard>
      {shown.map((merchant) => (
        <MerchantRow
          key={merchant.id}
          merchant={merchant}
          merchants={merchants}
          category={
            merchant.defaultCategoryId
              ? tree.rows.get(merchant.defaultCategoryId)
              : undefined
          }
        />
      ))}
    </ListCard>
  )
}

function AddMerchantButton() {
  const { t } = useTranslation()
  return (
    <FloatingAddButton
      label={t('merchants.add')}
      options={[
        {
          to: '/settings/merchants/new',
          label: t('merchants.add'),
          icon: 'plus',
        },
      ]}
    />
  )
}

function Merchants() {
  const { t } = useTranslation()
  const { merchants, categories } = Route.useLoaderData()
  const locale = FORMAT_LOCALE[useLocale()]
  const [query, setQuery] = useState('')
  const [sort, setSort] = useStoredState<MerchantSort>(
    'merchants.sort',
    'nameAsc',
    parseSort,
  )
  const tree = useCategoryTree(categories)
  const filters = merchantFilters(merchants, categories, locale)
  const values = filters.map((f) => f.value)
  const [chosen, setFilter] = useState<MerchantFilter>('all')
  const filter = values.includes(chosen) ? chosen : 'all'
  const q = foldForSearch(query)
  const shown = sortMerchants(
    filterMerchants(merchants, filter, tree).filter((m) =>
      foldForSearch(m.name).includes(q),
    ),
    { sort, pathOf: tree.pathOf, locale },
  )
  const guides = treeGuides(filters.map((f) => f.depth))
  const filterLabel = (f: MerchantFilter) => {
    if (f === 'all') return t('merchants.filterAll')
    if (f === 'none') return t('merchants.filterNone')
    return tree.pathOf(f) ?? ''
  }

  return (
    <SettingsPage
      title={t('merchants.title')}
      actions={
        <>
          {filters.length > 2 && (
            <ChoiceMenu
              icon="tags"
              label={t('common.filterLabel', { filter: filterLabel(filter) })}
              value={filter}
              options={values}
              labelOf={filterLabel}
              renderOption={(f, i) => (
                <FilterOption
                  category={tree.rows.get(f)}
                  name={tree.nameOf(f) ?? filterLabel(f)}
                  guide={guides[i]}
                />
              )}
              onChange={setFilter}
            />
          )}
          <SortMenu
            sort={sort}
            options={MERCHANT_SORTS}
            labelOf={(option) => t(`merchants.sort.${option}`)}
            onChange={setSort}
          />
        </>
      }
    >
      {merchants.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          {t('merchants.empty')}
        </p>
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} />
          <MerchantList merchants={merchants} shown={shown} tree={tree} />
        </>
      )}
      <AddMerchantButton />
      {/* The merchant form opens here as a sheet (spec 13). */}
      <Outlet />
    </SettingsPage>
  )
}

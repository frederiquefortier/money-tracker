import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { MerchantRow } from '#/components/merchants/merchant-row'
import { SearchField } from '#/components/forms/search-field'
import { ListPage } from '#/components/layout/list-page'
import { SortMenu } from '#/components/lists/sort-menu'
import { TreeGuides } from '#/components/lists/tree-guides'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import {
  MERCHANT_SORTS,
  filterMerchants,
  merchantFilters,
  sortMerchants,
} from '#/lib/merchants/merchant'
import type {
  Merchant,
  MerchantFilter,
  MerchantSort,
} from '#/lib/merchants/merchant'
import { treeGuides } from '#/lib/shared/tree-layout'
import type { TreeGuide } from '#/lib/shared/tree-layout'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { indexById, oneOf } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'

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

const parseSort = oneOf(MERCHANT_SORTS)

function categoryLookup(categories: ReadonlyArray<Category>) {
  const byId = indexById(categories)
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
  tree: ReturnType<typeof categoryLookup>
}) {
  const { t } = useTranslation()
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
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
    <FloatingAddLink to="/settings/merchants/new" label={t('merchants.add')} />
  )
}

function Merchants() {
  const { t } = useTranslation()
  const { merchants, categories } = Route.useLoaderData()
  const locale = useFormatLocale()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useStoredState<MerchantSort>(
    'merchants.sort',
    'nameAsc',
    parseSort,
  )
  const tree = categoryLookup(categories)
  const filters = merchantFilters(merchants, categories, locale)
  const values = filters.map((f) => f.value)
  const [chosen, setFilter] = useState<MerchantFilter>('all')
  const filter = values.includes(chosen) ? chosen : 'all'
  const matches = matcher(query)
  const shown = sortMerchants(
    filterMerchants(merchants, filter, tree).filter((m) => matches(m.name)),
    { sort, pathOf: tree.pathOf, locale },
  )
  const guides = treeGuides(filters.map((f) => f.depth))
  const filterLabel = (f: MerchantFilter) => {
    if (f === 'all') return t('merchants.filterAll')
    if (f === 'none') return t('merchants.filterNone')
    return tree.pathOf(f) ?? ''
  }

  return (
    <ListPage
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
        <EmptyState>{t('merchants.empty')}</EmptyState>
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} />
          <MerchantList merchants={merchants} shown={shown} tree={tree} />
        </>
      )}
      <AddMerchantButton />
      {/* The merchant form opens here as a sheet (spec 13). */}
      <Outlet />
    </ListPage>
  )
}

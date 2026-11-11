import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { MerchantRow } from '#/components/merchants/merchant-row'
import { SearchField } from '#/components/forms/search-field'
import { ListPage } from '#/components/layout/list-page'
import { SortMenu } from '#/components/lists/sort-menu'
import { useFilterLabel } from '#/hooks/transactions/use-filter-label'
import { FilterChips } from '#/components/transactions/filters/filter-chips'
import { FilterBubble } from '#/components/transactions/filters/filter-bubble'
import { FilterSheet } from '#/components/transactions/filters/filter-sheet'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import {
  MERCHANT_SORTS,
  filterMerchants,
  sortMerchants,
} from '#/lib/merchants/merchant'
import type { Merchant, MerchantSort } from '#/lib/merchants/merchant'
import { NO_FILTERS } from '#/lib/transactions/transaction-filters'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { indexById, oneOf } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'

export const Route = createFileRoute('/_authed/settings/merchants')({
  loader: async () => {
    const [merchants, categories, { people }] = await Promise.all([
      getMerchants(),
      getCategories(),
      getPeople(),
    ])
    return { merchants, categories, people }
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
    parentOf: (id: string) => byId.get(id)?.parentId,
  }
}

const CATEGORY_TABS = ['categories'] as const

/** The same bubble and sheet as the transactions' Catégories filter. */
function CategoryFilter({
  categories,
  picked,
  total,
  onChange,
}: {
  categories: ReadonlyArray<Category>
  picked: ReadonlyArray<string>
  total: number
  onChange: (ids: Array<string>) => void
}) {
  const labelOf = useFilterLabel({ ...NO_FILTERS, categoryIds: [...picked] })
  const [open, setOpen] = useState(false)
  const values = { ...NO_FILTERS, categoryIds: [...picked] }
  const names = {
    accounts: [],
    categories: categories.filter((c) => picked.includes(c.id)),
    merchants: [],
    people: [],
    events: [],
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <FilterBubble
        label={labelOf('categories')}
        count={picked.length}
        disabled={categories.length === 0 && picked.length === 0}
        onOpen={() => setOpen(true)}
      />
      <FilterChips
        values={values}
        names={names}
        onChange={(next) => onChange(next.categoryIds)}
      />
      <FilterSheet
        open={open}
        tabs={CATEGORY_TABS}
        tab="categories"
        values={values}
        total={total}
        onOpenChange={setOpen}
        onTab={() => {}}
        onChange={(next) => onChange(next.categoryIds)}
      />
    </div>
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
  const [picked, setPicked] = useState<Array<string>>([])
  const matches = matcher(query)
  const shown = sortMerchants(
    filterMerchants(merchants, picked, tree).filter((m) => matches(m.name)),
    { sort, pathOf: tree.pathOf, locale },
  )

  return (
    <ListPage
      title={t('merchants.title')}
      actions={
        <SortMenu
          sort={sort}
          options={MERCHANT_SORTS}
          labelOf={(option) => t(`merchants.sort.${option}`)}
          onChange={setSort}
        />
      }
    >
      {merchants.length === 0 ? (
        <EmptyState>{t('merchants.empty')}</EmptyState>
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} />
          <CategoryFilter
            categories={categories}
            picked={picked}
            total={shown.length}
            onChange={setPicked}
          />
          <MerchantList merchants={merchants} shown={shown} tree={tree} />
        </>
      )}
      <AddMerchantButton />
      {/* The merchant form opens here as a sheet (spec 13). */}
      <Outlet />
    </ListPage>
  )
}

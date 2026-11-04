import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddButton } from '#/components/add-button'
import { ChoiceMenu } from '#/components/choice-menu'
import { ListCard } from '#/components/list-card'
import { MerchantRow } from '#/components/merchants/merchant-row'
import { SearchField } from '#/components/search-field'
import { SettingsPage } from '#/components/settings-page'
import { SortMenu } from '#/components/sort-menu'
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
    parentOf: (id: string) => byId.get(id)?.parentId,
  }
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
  const filters = merchantFilters(merchants, tree, locale)
  const [chosen, setFilter] = useState<MerchantFilter>('all')
  const filter = filters.includes(chosen) ? chosen : 'all'
  const q = foldForSearch(query)
  const shown = sortMerchants(
    filterMerchants(merchants, filter, tree).filter((m) =>
      foldForSearch(m.name).includes(q),
    ),
    { sort, pathOf: tree.pathOf, locale },
  )
  const filterLabel = (f: MerchantFilter) => {
    if (f === 'all') return t('common.all')
    if (f === 'none') return t('merchants.filterNone')
    return tree.pathOf(f) ?? ''
  }

  return (
    <SettingsPage
      title={t('merchants.title')}
      actions={
        <>
          <SortMenu
            sort={sort}
            options={MERCHANT_SORTS}
            labelOf={(option) => t(`merchants.sort.${option}`)}
            onChange={setSort}
          />
          {filters.length > 2 && (
            <ChoiceMenu
              icon="filter"
              label={t('common.filterLabel', { filter: filterLabel(filter) })}
              value={filter}
              options={filters}
              labelOf={filterLabel}
              onChange={setFilter}
            />
          )}
          <AddButton
            to="/settings/merchants/new"
            text={t('merchants.addShort')}
            label={t('merchants.add')}
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
      {/* The merchant form opens here as a sheet (spec 13). */}
      <Outlet />
    </SettingsPage>
  )
}

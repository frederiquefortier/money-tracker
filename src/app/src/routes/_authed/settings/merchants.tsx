import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { MerchantRow } from '#/components/merchants/merchant-row'
import { SearchField } from '#/components/forms/search-field'
import { ListPage } from '#/components/layout/list-page'
import { SortMenu } from '#/components/lists/sort-menu'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { MERCHANT_SORTS, sortMerchants } from '#/lib/merchants/merchant'
import type { Merchant, MerchantSort } from '#/lib/merchants/merchant'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { indexById, oneOf } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'
import { listPagePending } from '#/components/layout/page-pending'
import { MerchantsSkeleton } from '#/components/merchants/merchants-skeleton'
import { useRevealed } from '#/hooks/app/use-revealed'
import { ListEnd } from '#/components/lists/list-end'

export const Route = createFileRoute('/_authed/settings/merchants')({
  ...listPagePending((t) => t('merchants.title'), { body: MerchantsSkeleton }),
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
  }
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
  const revealed = useRevealed(shown)
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
  return (
    <ListCard>
      {revealed.shown.map((merchant) => (
        <MerchantRow
          key={merchant.id}
          merchant={merchant}
          merchants={merchants}
          category={
            merchant.defaultCategoryId
              ? tree.rows.get(merchant.defaultCategoryId)
              : undefined
          }
          suggestion={
            merchant.suggestedCategoryId
              ? tree.rows.get(merchant.suggestedCategoryId)
              : undefined
          }
        />
      ))}
      {revealed.more && <ListEnd sentinel={revealed.sentinel} as="li" />}
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
  const matches = matcher(query)
  const shown = sortMerchants(
    merchants.filter((m) => matches(m.name)),
    { sort, pathOf: tree.pathOf, locale },
  )

  return (
    <ListPage
      title={t('merchants.title')}
      count={merchants.length}
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
          <MerchantList merchants={merchants} shown={shown} tree={tree} />
        </>
      )}
      <AddMerchantButton />
      {/* The merchant form opens here as a sheet. */}
      <Outlet />
    </ListPage>
  )
}

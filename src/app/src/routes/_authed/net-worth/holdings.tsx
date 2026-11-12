import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FormAlert } from '#/components/forms/form-field'
import { focusRing } from '#/components/styles'
import { cn } from '#/lib/utils'
import { ClosedHoldings } from '#/components/holdings/list/closed-holdings'
import { HoldingGroup } from '#/components/holdings/list/holding-group'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { ListPage } from '#/components/layout/list-page'
import { EmptyState } from '#/components/lists/list-card'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { NetWorthBackLink } from '#/components/net-worth/back-link'
import { holdingLabel } from '#/lib/holdings/holding'
import type { HoldingsPage, ListedHolding } from '#/lib/holdings/holding'
import {
  HOLDING_SORTS,
  drawersOf,
  holdingComparator,
} from '#/lib/holdings/holding-list'
import type { HoldingSort } from '#/lib/holdings/holding-list'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredIds, useStoredState } from '#/hooks/app/use-stored-state'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { compareNames, oneOf } from '#/lib/shared/collections'
import { SortMenu } from '#/components/lists/sort-menu'
import { FORMAT_LOCALE, inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { getHoldings } from '#/server/holdings'

export const Route = createFileRoute('/_authed/net-worth/holdings')({
  loader: () => getHoldings(),
  component: Holdings,
})

/** Rows with their label and institution; the open ones in drawers by institution (spec 19). */
const parseSort = oneOf(HOLDING_SORTS)

function shape(page: HoldingsPage, locale: Locale, sort: HoldingSort) {
  const institutions = new Map(page.institutions.map((i) => [i.id, i.name]))
  const listed: Array<ListedHolding> = page.holdings.map((holding) => {
    const institutionName = holding.institutionId
      ? (institutions.get(holding.institutionId) ?? null)
      : null
    return {
      ...holding,
      institutionName,
      typeText: inLocale(locale, holding.typeFr, holding.typeEn),
      // An open holding sits in its institution's drawer, so its label leaves the institution out.
      label: holdingLabel(
        { ...holding, institution: holding.closedOn ? institutionName : null },
        locale,
        { currency: false },
      ),
    }
  })
  const byName = compareNames(FORMAT_LOCALE[locale])
  return {
    drawers: drawersOf(
      listed.filter((h) => !h.closedOn),
      page.institutions,
      {
        compare: byName,
        compareHoldings: holdingComparator(sort, FORMAT_LOCALE[locale]),
      },
    ),
    closed: listed
      .filter((h) => h.closedOn)
      .sort((a, b) => byName({ name: a.label }, { name: b.label })),
  }
}

function Holdings() {
  const { t } = useTranslation()
  const page = Route.useLoaderData()
  const locale = useLocale()
  const collapsed = useStoredIds('holdings.collapsed')
  const { displayCurrency } = useMyCurrencies()
  const [sort, setSort] = useStoredState<HoldingSort>(
    'holdings.sort',
    'name',
    parseSort,
  )
  const { drawers, closed } = shape(page, locale, sort)

  const keys = drawers.map((drawer) => drawer.key)
  const allExpanded = keys.every((key) => !collapsed.ids.has(key))

  return (
    <ListPage
      title={t('holdings.title')}
      back={<NetWorthBackLink />}
      titleNote={
        page.unlinkedCount > 0 && (
          <Link
            to="/transactions"
            search={{ category: page.investmentCategoryIds }}
            className={cn('block w-fit max-w-full rounded-full', focusRing)}
          >
            <FormAlert
              tone="warning"
              size="tag"
              className="w-fit max-w-full hover:bg-warning/25"
            >
              {t('holdings.unlinked', { count: page.unlinkedCount })}
            </FormAlert>
          </Link>
        )
      }
      actions={
        <>
          {keys.length > 0 && (
            <ExpandAllButton
              allExpanded={allExpanded}
              onToggle={() => collapsed.setAll(keys, allExpanded)}
            />
          )}
          <SortMenu
            sort={sort}
            options={HOLDING_SORTS}
            labelOf={(option) => t(`holdings.sort.${option}`)}
            onChange={setSort}
          />
        </>
      }
    >
      {page.holdings.length === 0 && (
        <EmptyState>{t('holdings.empty')}</EmptyState>
      )}
      {drawers.map((drawer) => (
        <HoldingGroup
          key={drawer.key}
          drawer={drawer}
          name={drawer.institution?.name ?? t('accounts.noInstitution')}
          displayCurrency={displayCurrency}
          collapsed={collapsed.ids.has(drawer.key)}
          onToggle={() => collapsed.toggle(drawer.key)}
        />
      ))}
      <ClosedHoldings holdings={closed} />
      <FloatingAddLink
        to="/net-worth/holdings/new"
        label={t('holdings.addHolding')}
      />
      {/* The holding form opens here as a sheet, over the list. */}
      <Outlet />
    </ListPage>
  )
}

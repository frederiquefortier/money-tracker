import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
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
import { drawersOf, holdingLabel } from '#/lib/holdings/holding'
import type { HoldingsPage, ListedHolding } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { compareNames } from '#/lib/shared/collections'
import { FORMAT_LOCALE, inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { getHoldings } from '#/server/holdings'

export const Route = createFileRoute('/_authed/net-worth/holdings')({
  loader: () => getHoldings(),
  component: Holdings,
})

/** Rows with their label and institution; the open ones in drawers by institution (spec 19). */
function shape(page: HoldingsPage, locale: Locale) {
  const institutions = new Map(page.institutions.map((i) => [i.id, i.name]))
  const listed: Array<ListedHolding> = page.holdings.map((holding) => {
    const institutionName = holding.institutionId
      ? (institutions.get(holding.institutionId) ?? null)
      : null
    return {
      ...holding,
      institutionName,
      typeText: inLocale(locale, holding.typeFr, holding.typeEn),
      label: holdingLabel({ ...holding, institution: institutionName }, locale),
    }
  })
  const byName = compareNames(FORMAT_LOCALE[locale])
  return {
    drawers: drawersOf(
      listed.filter((h) => !h.closedOn),
      page.institutions,
      byName,
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
  const { drawers, closed } = shape(page, locale)

  const keys = drawers.map((drawer) => drawer.key)
  const allExpanded = keys.every((key) => !collapsed.ids.has(key))

  return (
    <ListPage
      title={t('holdings.title')}
      back={<NetWorthBackLink />}
      actions={
        keys.length > 0 && (
          <ExpandAllButton
            allExpanded={allExpanded}
            onToggle={() => collapsed.setAll(keys, allExpanded)}
          />
        )
      }
    >
      {page.unlinkedCount > 0 && (
        <Link
          to="/transactions"
          search={{ category: page.investmentCategoryIds }}
          className={cn('block w-fit max-w-full rounded-lg', focusRing)}
        >
          <FormAlert
            tone="warning"
            className="w-fit max-w-full items-center font-semibold hover:bg-warning/25"
          >
            {t('holdings.unlinked', { count: page.unlinkedCount })}
            <Icon name="chevron-right" className="size-4" />
          </FormAlert>
        </Link>
      )}
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

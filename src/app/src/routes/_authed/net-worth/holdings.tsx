import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ClosedHoldings } from '#/components/holdings/list/closed-holdings'
import { HoldingGroup } from '#/components/holdings/list/holding-group'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { ListPage } from '#/components/layout/list-page'
import { EmptyState } from '#/components/lists/list-card'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { NetWorthBackLink } from '#/components/net-worth/back-link'
import { holdingTypeLabel, groupByKind } from '#/lib/holdings/holding'
import type { HoldingsPage, ListedHolding } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import { compareNames } from '#/lib/shared/collections'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { getHoldings } from '#/server/holdings'

export const Route = createFileRoute('/_authed/net-worth/holdings')({
  loader: () => getHoldings(),
  component: Holdings,
})

/** Rows with their type and institution; the open ones by kind, A to Z (NW-01). */
function shape(page: HoldingsPage, locale: Locale) {
  const types = new Map(page.types.map((type) => [type.code, type]))
  const institutions = new Map(page.institutions.map((i) => [i.id, i.name]))
  const listed: Array<ListedHolding> = page.holdings.map((holding) => {
    const type = types.get(holding.type)
    return {
      ...holding,
      typeLabel: type ? holdingTypeLabel(type, locale) : holding.type,
      institutionName: holding.institutionId
        ? (institutions.get(holding.institutionId) ?? null)
        : null,
    }
  })
  const byName = compareNames(FORMAT_LOCALE[locale])
  return {
    groups: groupByKind(listed.filter((h) => !h.closedOn).sort(byName)),
    closed: listed.filter((h) => h.closedOn).sort(byName),
  }
}

function Holdings() {
  const { t } = useTranslation()
  const page = Route.useLoaderData()
  const locale = useLocale()
  const collapsed = useStoredIds('holdings.collapsed')
  const { groups, closed } = shape(page, locale)

  const keys = groups.map((group) => group.kind)
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
      {page.holdings.length === 0 && (
        <EmptyState>{t('holdings.empty')}</EmptyState>
      )}
      {groups.map(({ kind, holdings }) => (
        <HoldingGroup
          key={kind}
          kind={kind}
          holdings={holdings}
          collapsed={collapsed.ids.has(kind)}
          onToggle={() => collapsed.toggle(kind)}
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

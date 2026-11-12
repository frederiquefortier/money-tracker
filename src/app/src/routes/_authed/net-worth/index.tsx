import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HubCard, TotalCard } from '#/components/net-worth/hub-cards'
import { ListPage } from '#/components/layout/list-page'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { getNetWorth } from '#/server/net-worth'
import type { NetWorth } from '#/lib/net-worth/net-worth'

export const Route = createFileRoute('/_authed/net-worth/')({
  loader: () => getNetWorth(),
  component: NetWorthHub,
})

const COUNT_KEYS = {
  investment: 'netWorth.investments',
  asset: 'netWorth.assets',
  debt: 'netWorth.debts',
} as const

/** "2 placements, 1 actif", then when the values were last updated. */
function useHoldingsDetail(holdings: NetWorth['holdings']) {
  const { t } = useTranslation()
  const locale = useLocale()
  const counts = HOLDING_KINDS.filter((kind) => holdings.counts[kind] > 0)
    .map((kind) => t(COUNT_KEYS[kind], { count: holdings.counts[kind] }))
    .join(', ')
  return holdings.updatedOn
    ? `${counts} · ${t('netWorth.updatedOn', {
        date: formatDate(holdings.updatedOn, locale, 'medium'),
      })}`
    : counts
}

function NetWorthHub() {
  const { t } = useTranslation()
  const { displayCurrency, accounts, holdings, total, converted } =
    Route.useLoaderData()
  const holdingsDetail = useHoldingsDetail(holdings)
  const holdingsCount = HOLDING_KINDS.reduce(
    (sum, kind) => sum + holdings.counts[kind],
    0,
  )

  return (
    <ListPage title={t('netWorth.title')}>
      <TotalCard
        total={total}
        currency={displayCurrency}
        converted={converted}
      />
      {/* Phase 5: the chart sits here. */}
      <div className="grid gap-3 md:grid-cols-2">
        <HubCard
          to="/net-worth/accounts"
          icon="wallet"
          title={t('accounts.title')}
          detail={t('netWorth.accountsCount', { count: accounts.count })}
          total={accounts.total}
          currency={displayCurrency}
          converted={accounts.converted}
        />
        <HubCard
          to="/net-worth/holdings"
          icon="coins"
          title={t('holdings.title')}
          detail={holdingsCount > 0 ? holdingsDetail : t('holdings.empty')}
          total={holdingsCount > 0 ? holdings.total : undefined}
          currency={displayCurrency}
          converted={holdings.converted}
        />
      </div>
    </ListPage>
  )
}

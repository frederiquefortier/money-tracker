import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HubCard } from '#/components/net-worth/hub-cards'
import { HideItemsButton } from '#/components/net-worth/hide-items-sheet'
import { NetWorthDashboard } from '#/components/net-worth/net-worth-dashboard'
import { useNetWorthChart } from '#/hooks/net-worth/use-net-worth-chart'
import { ListPage } from '#/components/layout/list-page'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { getNetWorth } from '#/server/net-worth'
import { listPagePending } from '#/components/layout/page-pending'

export const Route = createFileRoute('/_authed/net-worth/')({
  ...listPagePending((t) => t('netWorth.title'), { wide: true }),
  loader: () => getNetWorth(),
  component: NetWorthHub,
})

function NetWorthHub() {
  const { t } = useTranslation()
  const {
    displayCurrency,
    accounts,
    holdings,
    total,
    converted,
    series,
    items,
  } = Route.useLoaderData()
  const chart = useNetWorthChart(series, items)
  const holdingsCount = HOLDING_KINDS.reduce(
    (sum, kind) => sum + holdings.counts[kind],
    0,
  )

  return (
    <ListPage
      title={t('netWorth.title')}
      wide
      actions={items.length > 0 && <HideItemsButton chart={chart} />}
    >
      <NetWorthDashboard
        chart={chart}
        total={total}
        currency={displayCurrency}
        converted={converted}
        items={items}
        links={
          <>
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
              detail={
                holdingsCount > 0
                  ? t('netWorth.holdingsCount', { count: holdingsCount })
                  : t('holdings.empty')
              }
              total={holdingsCount > 0 ? holdings.total : undefined}
              currency={displayCurrency}
              converted={holdings.converted}
            />
          </>
        }
      />
    </ListPage>
  )
}

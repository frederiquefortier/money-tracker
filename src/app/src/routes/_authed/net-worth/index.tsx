import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HubCard, TotalCard } from '#/components/net-worth/hub-cards'
import { ListPage } from '#/components/layout/list-page'
import { getNetWorth } from '#/server/net-worth'

export const Route = createFileRoute('/_authed/net-worth/')({
  loader: () => getNetWorth(),
  component: NetWorthHub,
})

function NetWorthHub() {
  const { t } = useTranslation()
  const { displayCurrency, accounts, total, converted } = Route.useLoaderData()

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
      </div>
    </ListPage>
  )
}

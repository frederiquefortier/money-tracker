import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HubCard, TotalCard } from '#/components/net-worth/hub-cards'
import { ListPage } from '#/components/layout/list-page'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { getNetWorth } from '#/server/net-worth'
import { listPagePending } from '#/components/layout/page-pending'

export const Route = createFileRoute('/_authed/net-worth/')({
  ...listPagePending((t) => t('netWorth.title'), { wide: true }),
  loader: () => getNetWorth(),
  component: NetWorthHub,
})

function NetWorthHub() {
  const { t } = useTranslation()
  const { displayCurrency, accounts, holdings, total, converted } =
    Route.useLoaderData()
  const locale = useLocale()
  const holdingsCount = HOLDING_KINDS.reduce(
    (sum, kind) => sum + holdings.counts[kind],
    0,
  )

  return (
    <ListPage title={t('netWorth.title')} wide>
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
          titleNote={
            holdings.updatedOn
              ? t('netWorth.updatedOn', {
                  date: formatDate(holdings.updatedOn, locale, 'medium'),
                })
              : null
          }
          detail={
            holdingsCount > 0
              ? t('netWorth.holdingsCount', { count: holdingsCount })
              : t('holdings.empty')
          }
          total={holdingsCount > 0 ? holdings.total : undefined}
          currency={displayCurrency}
          converted={holdings.converted}
        />
      </div>
    </ListPage>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HoldingForm } from '#/components/holdings/form/holding-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { todayIso } from '#/lib/shared/format'
import { useHoldingsPage } from '#/hooks/app/use-page-data'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'

export const Route = createFileRoute('/_authed/net-worth/holdings/new')({
  staticData: { sheet: true },
  component: NewHolding,
})

function NewHolding() {
  const { t } = useTranslation()
  const { institutions, types } = useHoldingsPage()
  const { defaultCurrency } = useMyCurrencies()
  const type = types.at(0)

  return (
    <RouteSheet to="/net-worth/holdings" title={t('holdings.newTitle')}>
      <HoldingForm
        initial={{
          name: '',
          type: type?.code ?? '',
          country: type?.country ?? '',
          openedOn: todayIso(),
          excludeFromNetWorth: false,
        }}
        initialCurrency={defaultCurrency}
        initialInstitutionId={null}
        institutions={institutions}
        types={types}
        currencyLocked={false}
        savedText={t('holdings.created')}
      />
    </RouteSheet>
  )
}

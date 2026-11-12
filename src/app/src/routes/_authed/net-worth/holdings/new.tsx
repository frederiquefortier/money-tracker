import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HoldingForm } from '#/components/holdings/form/holding-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { typesFor } from '#/components/holdings/form/holding-fields'
import { defaultCountry } from '#/lib/holdings/countries'
import { OTHER_TYPE } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
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
  const locale = useLocale()
  const country = defaultCountry(locale)
  const type = typesFor(types, country, locale).at(0)

  return (
    <RouteSheet to="/net-worth/holdings" title={t('holdings.newTitle')}>
      <HoldingForm
        initial={{
          country,
          type: type?.code ?? OTHER_TYPE,
          customType: '',
          kind: '',
          name: '',
          openedOn: todayIso(),
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

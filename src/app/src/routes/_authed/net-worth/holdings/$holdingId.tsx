import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HoldingForm } from '#/components/holdings/form/holding-form'
import { HoldingActions } from '#/components/holdings/list/holding-actions'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { OTHER_TYPE, holdingLabel } from '#/lib/holdings/holding'
import { useHoldingsPage } from '#/hooks/app/use-page-data'
import { useLocale } from '#/hooks/app/use-locale'
import { getHolding } from '#/server/holdings'

export const Route = createFileRoute('/_authed/net-worth/holdings/$holdingId')({
  staticData: { sheet: true },
  loader: ({ params }) => getHolding({ data: { id: params.holdingId } }),
  component: EditHolding,
})

function EditHolding() {
  const { t } = useTranslation()
  const { institutions, types } = useHoldingsPage()
  const holding = Route.useLoaderData()
  const locale = useLocale()
  if (!holding) return <Navigate to="/net-worth/holdings" resetScroll={false} />

  const label = holdingLabel(
    {
      ...holding,
      institution:
        institutions.find((i) => i.id === holding.institutionId)?.name ?? null,
    },
    locale,
  )

  return (
    <RouteSheet
      to="/net-worth/holdings"
      title={t('holdings.editTitle')}
      actions={
        <HoldingActions holding={{ ...holding, label }} placement="sheet" />
      }
    >
      <HoldingForm
        key={holding.id}
        holdingId={holding.id}
        initial={{
          country: holding.country,
          type: holding.type ?? OTHER_TYPE,
          customType: holding.type === null ? holding.typeFr : '',
          kind: holding.type === null ? holding.kind : '',
          name: holding.name ?? '',
          openedOn: holding.openedOn,
        }}
        initialCurrency={holding.currency}
        initialInstitutionId={holding.institutionId}
        institutions={institutions}
        types={types}
        currencyLocked={holding.inUse}
        savedText={t('holdings.updated')}
      />
    </RouteSheet>
  )
}

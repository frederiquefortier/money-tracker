import { useState } from 'react'
import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EntryLists } from '#/components/holdings/form/entry-lists'
import type { EntryTarget } from '#/components/holdings/form/entry-lists'
import { EntrySheet } from '#/components/holdings/form/entry-sheet'
import { HoldingForm } from '#/components/holdings/form/holding-form'
import { HoldingActions } from '#/components/holdings/list/holding-actions'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { todayIso } from '#/lib/shared/format'
import { useHoldingsPage } from '#/hooks/app/use-page-data'
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
  const [entry, setEntry] = useState<EntryTarget | null>(null)
  if (!holding) return <Navigate to="/net-worth/holdings" resetScroll={false} />

  const rows =
    entry?.kind === 'contribution' ? holding.contributions : holding.snapshots
  const hasEntries =
    holding.snapshots.length > 0 ||
    holding.contributions.length > 0 ||
    holding.inUse

  return (
    <>
      <RouteSheet
        to="/net-worth/holdings"
        title={t('holdings.editTitle')}
        actions={<HoldingActions holding={holding} placement="sheet" />}
      >
        <HoldingForm
          key={holding.id}
          holdingId={holding.id}
          initial={{
            name: holding.name,
            type: holding.type,
            country: holding.country ?? '',
            openedOn: holding.openedOn,
            excludeFromNetWorth: holding.excludeFromNetWorth,
          }}
          initialCurrency={holding.currency}
          initialInstitutionId={holding.institutionId}
          institutions={institutions}
          types={types}
          currencyLocked={hasEntries}
          savedText={t('holdings.updated')}
        >
          <EntryLists
            snapshots={holding.snapshots}
            contributions={holding.contributions}
            currency={holding.currency}
            showContributions={holding.kind === 'investment'}
            onOpen={setEntry}
          />
        </HoldingForm>
      </RouteSheet>
      {entry && (
        <EntrySheet
          kind={entry.kind}
          entry={rows.find((row) => row.id === entry.id) ?? null}
          holdingId={holding.id}
          currency={holding.currency}
          today={todayIso()}
          onClosed={() => setEntry(null)}
        />
      )}
    </>
  )
}

import { Navigate, createFileRoute } from '@tanstack/react-router'
import { TransferSheet } from '#/components/holdings/form/transfer-sheet'
import { getHolding } from '#/server/holdings'
import { holdingLabel } from '#/lib/holdings/holding'
import { useHoldingsPage } from '#/hooks/app/use-page-data'
import { useLocale } from '#/hooks/app/use-locale'
import { SHEET_PENDING } from '#/components/sheet/pending-sheet'

export const Route = createFileRoute(
  '/_authed/net-worth/holdings/$holdingId_/transfer',
)({
  staticData: { sheet: true },
  ...SHEET_PENDING,
  loader: ({ params }) => getHolding({ data: { id: params.holdingId } }),
  component: Transfer,
})

function Transfer() {
  const detail = Route.useLoaderData()
  const { holdings, institutions, types } = useHoldingsPage()
  const locale = useLocale()
  const listed = holdings.map((holding) => ({
    ...holding,
    label: holdingLabel(
      {
        ...holding,
        institution:
          institutions.find((i) => i.id === holding.institutionId)?.name ??
          null,
      },
      locale,
      { currency: false },
    ),
  }))
  const source = listed.find((h) => h.id === detail?.id)
  if (!detail || !source || source.kind !== 'investment')
    return <Navigate to="/net-worth/holdings" resetScroll={false} />
  return (
    <TransferSheet
      source={source}
      transfers={detail.transfers}
      holdings={listed}
      institutions={institutions}
      types={types}
    />
  )
}

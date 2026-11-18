import { Navigate, createFileRoute } from '@tanstack/react-router'
import { EntriesSheet } from '#/components/holdings/form/entries-sheet'
import { getHolding } from '#/server/holdings'
import { SHEET_PENDING } from '#/components/sheet/pending-sheet'

export const Route = createFileRoute(
  '/_authed/net-worth/holdings/$holdingId_/values',
)({
  staticData: { sheet: true },
  ...SHEET_PENDING,
  loader: ({ params }) => getHolding({ data: { id: params.holdingId } }),
  component: Values,
})

function Values() {
  const holding = Route.useLoaderData()
  if (!holding) return <Navigate to="/net-worth" resetScroll={false} />
  return <EntriesSheet kind="snapshot" holding={holding} />
}

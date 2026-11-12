import { Navigate, createFileRoute } from '@tanstack/react-router'
import { EntriesSheet } from '#/components/holdings/form/entries-sheet'
import { getHolding } from '#/server/holdings'

export const Route = createFileRoute(
  '/_authed/net-worth/holdings/$holdingId_/contributions',
)({
  staticData: { sheet: true },
  loader: ({ params }) => getHolding({ data: { id: params.holdingId } }),
  component: Contributions,
})

function Contributions() {
  const holding = Route.useLoaderData()
  if (!holding || holding.kind !== 'investment')
    return <Navigate to="/net-worth/holdings" resetScroll={false} />
  return <EntriesSheet kind="contribution" holding={holding} />
}

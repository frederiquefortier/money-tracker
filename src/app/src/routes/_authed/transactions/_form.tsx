import { Outlet, createFileRoute } from '@tanstack/react-router'
import { loadTransactionForm } from '#/server/transaction-form'
import { SHEET_PENDING } from '#/components/sheet/pending-sheet'

// A layout with no path of its own: the sheets that hold the transaction form (new,
// edit, transfer) share what its pickers need, loaded once instead of by each sheet and
// each row hovered, and kept for a minute. Closing a sheet leaves it alone (it counts as
// one, see RouteSheet); any other write that calls router.invalidate() makes it load again.
export const Route = createFileRoute('/_authed/transactions/_form')({
  loader: () => loadTransactionForm(),
  staleTime: 60_000,
  staticData: { sheet: true },
  ...SHEET_PENDING,
  component: Outlet,
})

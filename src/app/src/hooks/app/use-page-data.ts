import { useLoaderData } from '@tanstack/react-router'

// The loader data of a list, for the sheets opened over it.

/** The accounts, from the net worth hub (ADR-061). */
export function useAccountsPage() {
  return useLoaderData({ from: '/_authed/net-worth' }).accounts
}

/** The holdings, from the net worth hub (ADR-061). */
export function useHoldingsPage() {
  return useLoaderData({ from: '/_authed/net-worth' }).holdings
}

export function useInstitutionsPage() {
  return useLoaderData({ from: '/_authed/settings/institutions' })
}

export function useCategoriesPage() {
  return useLoaderData({ from: '/_authed/settings/categories' })
}

export function useMerchantsPage() {
  return useLoaderData({ from: '/_authed/settings/merchants' })
}

export function usePeoplePage() {
  return useLoaderData({ from: '/_authed/settings/people' })
}

export function useEventsPage() {
  return useLoaderData({ from: '/_authed/settings/events' })
}

/** What the transaction form's pickers need, loaded once for all its sheets. */
export function useTransactionFormData() {
  return useLoaderData({ from: '/_authed/transactions/_form' })
}

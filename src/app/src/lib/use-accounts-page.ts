import { useLoaderData } from '@tanstack/react-router'

/** The Comptes loader data, for the sheets opened over that list. */
export function useAccountsPage() {
  return useLoaderData({ from: '/_authed/settings/accounts' })
}

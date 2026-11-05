import { useLoaderData } from '@tanstack/react-router'

// The loader data of a list, for the sheets opened over it.

export function useAccountsPage() {
  return useLoaderData({ from: '/_authed/settings/accounts' })
}

export function useCategoriesPage() {
  return useLoaderData({ from: '/_authed/settings/categories' })
}

export function useMerchantsPage() {
  return useLoaderData({ from: '/_authed/settings/merchants' })
}

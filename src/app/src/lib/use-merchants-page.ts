import { useLoaderData } from '@tanstack/react-router'

/** The Marchands loader data, for the sheets opened over that list. */
export function useMerchantsPage() {
  return useLoaderData({ from: '/_authed/settings/merchants' })
}

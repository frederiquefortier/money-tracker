import { useLoaderData } from '@tanstack/react-router'

/** The user's currencies and the profile's default and display ones (CUR-01..06). */
export function useMyCurrencies() {
  return useLoaderData({ from: '/_authed' })
}

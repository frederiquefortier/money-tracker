import { useLoaderData } from '@tanstack/react-router'

/** The Catégories loader data, for the sheets opened over that list. */
export function useCategoriesPage() {
  return useLoaderData({ from: '/_authed/settings/categories' })
}

import { useRouter } from '@tanstack/react-router'
import type { AnyRouteMatch } from '@tanstack/react-router'

/**
 * Loads the page's data again after a write, the page staying on screen with the bar at
 * the top until the new data shows (ADR-065). A plain `invalidate()` reloads a page that
 * has data in the background: it ends at once and the bar never shows.
 */
export function useRefresh() {
  const router = useRouter()
  return (filter?: (match: AnyRouteMatch) => boolean) =>
    router.invalidate({ filter, sync: true })
}

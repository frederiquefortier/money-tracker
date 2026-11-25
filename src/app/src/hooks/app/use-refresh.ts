import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { AnyRouteMatch, NavigateOptions } from '@tanstack/react-router'

/**
 * Loads the page's data again after a write, the page staying on screen with the bar at
 * the top until the new data shows (ADR-065). A plain `invalidate()` reloads a page that
 * has data in the background: it ends at once and the bar never shows. The reads cached
 * by Query are marked stale too: those on screen load again, the others when next shown.
 */
export function useRefresh() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return (filter?: (match: AnyRouteMatch) => boolean) => {
    void queryClient.invalidateQueries()
    return router.invalidate({ filter, sync: true })
  }
}

/**
 * After signing in or out, on to the next page: nothing read in the last session stays
 * cached.
 */
export function useSessionReload() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return async (next: NavigateOptions) => {
    queryClient.clear()
    await router.invalidate()
    await router.navigate(next)
  }
}

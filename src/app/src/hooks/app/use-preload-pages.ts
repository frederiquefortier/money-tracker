import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

// Every request to Supabase costs about 200 ms whatever the query, so a page's first
// visit waited on its loader. Loaded in the background once the app shows, a first visit
// shows at once like a revisit, and refreshes in the background when stale.
const PAGES = [
  '/transactions',
  '/net-worth',
  '/settings/categories',
  '/settings/merchants',
  '/settings/people',
  '/settings/events',
  '/settings/institutions',
  '/settings/currencies',
] as const

const AFTER_MS = 1000

export function usePreloadPages() {
  const router = useRouter()
  useEffect(() => {
    const timer = setTimeout(() => {
      const here = router.state.location.pathname
      for (const to of PAGES)
        if (to !== here) router.preloadRoute({ to }).catch(() => {})
    }, AFTER_MS)
    return () => clearTimeout(timer)
  }, [router])
}

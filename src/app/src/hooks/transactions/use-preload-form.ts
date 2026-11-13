import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

/**
 * Loads the transaction form's code and pickers once the list is on screen, so the first
 * sheet opened does not wait on them (about 2 s cold). Later openings reuse them.
 */
export function usePreloadForm() {
  const router = useRouter()
  useEffect(() => {
    router.preloadRoute({ to: '/transactions/new' }).catch(() => {})
  }, [router])
}

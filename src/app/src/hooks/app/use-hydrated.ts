import { useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}

/**
 * False on the server and during hydration, true after; true at once on a page opened
 * from inside the app, so nothing flashes there.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
}

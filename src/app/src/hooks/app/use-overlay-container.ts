import { createContext, useContext } from 'react'

// The sheet or dialog an overlay is opened from, so a picker can cover that panel only and
// stay inside the Radix dialog's focus and pointer scope (ADR-027).
export const OverlayContainer = createContext<HTMLElement | null>(null)

/** The open sheet's or dialog's panel, or null outside both. */
export function useOverlayContainer() {
  return useContext(OverlayContainer)
}

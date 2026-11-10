import * as React from 'react'

// The sheet or dialog an overlay is opened from, so a picker can cover that panel only and
// stay inside the Radix dialog's focus and pointer scope (ADR-027).
const OverlayContainer = React.createContext<HTMLElement | null>(null)

export const OverlayContainerProvider = OverlayContainer

/** The open sheet's or dialog's panel, or null outside both. */
export function useOverlayContainer() {
  return React.useContext(OverlayContainer)
}

/**
 * Whether an event came from inside a react-aria overlay (a calendar). Radix dismisses on
 * a tap or an Escape it thinks is outside, so its sheets, dialogs and popovers ask first.
 */
export function inAriaOverlay(target: EventTarget | null) {
  return target instanceof Element && target.closest('[data-rac]') !== null
}

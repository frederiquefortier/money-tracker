/**
 * Whether an event came from inside a react-aria overlay (a calendar). Radix dismisses on
 * a tap or an Escape it thinks is outside, so its sheets, dialogs and popovers ask first.
 */
export function inAriaOverlay(target: EventTarget | null) {
  return target instanceof Element && target.closest('[data-rac]') !== null
}

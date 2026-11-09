import { createContext, useContext, useEffect, useRef } from 'react'

export const CloseSheet = createContext<() => void>(() => {})
export const MarkChanged = createContext<() => void>(() => {})
// Layers over the sheet, innermost last: Escape runs the last one's handler.
export const EscapeTo = createContext<(handler: () => void) => () => void>(
  () => () => {},
)

/** Closes the enclosing sheet with its animation (a RouteSheet then leaves its route). */
export function useCloseSheet() {
  return useContext(CloseSheet)
}

/**
 * Tells the enclosing sheet that something changed, for the choices typing does not
 * report (a picker, a tab). Outside a sheet it does nothing.
 */
export function useMarkChanged() {
  return useContext(MarkChanged)
}

/**
 * While mounted, Escape runs `handler` instead of closing the sheet: a layer over the
 * sheet (the category list) goes back one level, a field being typed (a create row)
 * stops. The innermost wins; the one under it is back once it unmounts.
 */
export function useSheetEscape(handler: () => void) {
  const push = useContext(EscapeTo)
  const latest = useRef(handler)
  latest.current = handler
  useEffect(() => push(() => latest.current()), [push])
}

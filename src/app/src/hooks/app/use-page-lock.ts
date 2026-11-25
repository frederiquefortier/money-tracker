import { useEffect } from 'react'
import { isTouchDevice } from '#/lib/shared/touch'

// Sheets stack (the category form over a transaction): the page is freed by the last one.
let locks = 0
let lockedAt = 0

/**
 * Holds the page still under an open sheet on a phone. Radix sets `overflow: hidden` on
 * the body, but Safari on iPhone scrolls the page anyway to bring a field above the
 * keyboard, and the page then shows under the sheet's footer. A fixed body has nothing
 * to scroll; the scroll position is put back on close.
 */
export function usePageLock() {
  useEffect(() => {
    if (!isTouchDevice()) return
    const body = document.body.style
    if (locks++ === 0) {
      lockedAt = window.scrollY
      Object.assign(body, {
        position: 'fixed',
        top: `-${lockedAt}px`,
        left: '0',
        right: '0',
      })
    }
    return () => {
      if (--locks > 0) return
      Object.assign(body, { position: '', top: '', left: '', right: '' })
      window.scrollTo(0, lockedAt)
    }
  }, [])
}

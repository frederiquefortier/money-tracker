import { useEffect } from 'react'
import { isTouchDevice } from '#/lib/shared/touch'

/**
 * Keeps a fixed panel on the visible part of the screen. Safari on iPhone leaves the
 * layout viewport as it was when the keyboard opens and scrolls it instead, so a
 * full-screen panel ends up partly under the keyboard and taps land below the field they
 * seem to hit. The panel takes the visual viewport's top and height; elsewhere nothing
 * changes.
 */
export function useVisualViewport(panel: HTMLElement | null) {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!panel || !viewport || !isTouchDevice()) return
    const sync = () => {
      panel.style.top = `${viewport.offsetTop}px`
      panel.style.height = `${viewport.height}px`
    }
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      panel.style.top = ''
      panel.style.height = ''
    }
  }, [panel])
}

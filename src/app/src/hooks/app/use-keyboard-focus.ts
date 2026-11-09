import { useEffect } from 'react'

/**
 * Marks `<html data-keyboard>` from a Tab until the next pointer press. Text fields match
 * `:focus-visible` on a click too, so the outline is shown only while it is set
 * (styles.css): keyboard navigation only, never after a click (decided 2026-11-05).
 */
export function useKeyboardFocus() {
  useEffect(() => {
    const root = document.documentElement
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') root.dataset.keyboard = ''
    }
    const onPointer = () => {
      delete root.dataset.keyboard
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [])
}

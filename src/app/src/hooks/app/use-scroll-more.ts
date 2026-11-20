import { useCallback, useEffect, useState } from 'react'

/**
 * Whether a scrolling box hides more below its edge, to fade that edge as a cue that it
 * scrolls (author, 2026-11-20). Give `ref` to the box; it updates on scroll and resize.
 */
export function useScrollMore<T extends HTMLElement>() {
  const [box, setBox] = useState<T | null>(null)
  const [more, setMore] = useState(false)
  const measure = useCallback(() => {
    if (box) setMore(box.scrollTop + box.clientHeight < box.scrollHeight - 1)
  }, [box])
  useEffect(() => {
    if (!box) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    box.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      box.removeEventListener('scroll', measure)
    }
  }, [box, measure])
  return { ref: setBox, more }
}

import { useCallback, useEffect, useState } from 'react'

/**
 * Whether a scrolling box hides more before or after its edges, to fade each edge as a cue
 * that it scrolls: top and bottom on `y`, left and right on `x`. Give
 * `ref` to the box; it updates on scroll and when the box or its content resizes.
 */
export function useScrollMore<T extends HTMLElement>(axis: 'x' | 'y' = 'y') {
  const [box, setBox] = useState<T | null>(null)
  const [start, setStart] = useState(false)
  const [end, setEnd] = useState(false)
  const measure = useCallback(() => {
    if (!box) return
    const [scrolled, shown, total] =
      axis === 'y'
        ? [box.scrollTop, box.clientHeight, box.scrollHeight]
        : [box.scrollLeft, box.clientWidth, box.scrollWidth]
    setStart(scrolled > 1)
    setEnd(scrolled + shown < total - 1)
  }, [box, axis])
  useEffect(() => {
    if (!box) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    if (box.firstElementChild) observer.observe(box.firstElementChild)
    box.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      box.removeEventListener('scroll', measure)
    }
  }, [box, measure])
  return { ref: setBox, start, end }
}

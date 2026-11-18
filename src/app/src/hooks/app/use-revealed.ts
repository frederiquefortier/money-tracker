import { useEffect, useState } from 'react'

/**
 * The first `step` items, then `step` more each time the sentinel nears the screen. A
 * row costs about 1 ms to build (link, icons, actions), so 674 merchants froze the page
 * for most of a second; now only what is near the screen is built. `atLeast` keeps that
 * many built whatever the scroll (a list's keyboard position).
 */
export function useRevealed<T, TElement extends Element = HTMLElement>(
  items: ReadonlyArray<T>,
  step = 60,
  atLeast = 0,
) {
  const [revealed, setRevealed] = useState(step)
  const [target, sentinel] = useState<TElement | null>(null)
  const count = Math.max(revealed, atLeast)
  const more = count < items.length
  useEffect(() => {
    if (!target || !more) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          setRevealed((c) => Math.max(c, count) + step)
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [target, more, step, count])
  return { shown: more ? items.slice(0, count) : items, more, sentinel }
}

import { useEffect, useState } from 'react'

/**
 * The month whose section crosses a band near the top of the screen, for the timeline's
 * sticky list. `count` re-observes as more months are built.
 */
export function useActiveMonth(container: HTMLElement | null, count: number) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting && entry.target instanceof HTMLElement)
            setActive(entry.target.dataset.month ?? null)
      },
      { rootMargin: '-25% 0px -70% 0px' },
    )
    for (const section of container.querySelectorAll('[data-month]'))
      observer.observe(section)
    return () => observer.disconnect()
  }, [container, count])
  return active
}

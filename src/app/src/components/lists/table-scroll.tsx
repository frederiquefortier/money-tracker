import { useEffect, useState } from 'react'
import { useScrollMore } from '#/hooks/app/use-scroll-more'
import { cn } from '#/lib/utils'

const EDGE =
  'pointer-events-none absolute inset-y-0 z-20 w-10 from-transparent to-[var(--card)] transition-opacity'

/** The width of the table's sticky first column, where the left fade starts. */
function useStickyWidth(box: HTMLElement | null) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const cell = box?.querySelector<HTMLElement>('thead th:first-child')
    if (!cell) return
    const observer = new ResizeObserver(() => setWidth(cell.offsetWidth))
    observer.observe(cell)
    return () => observer.disconnect()
  }, [box])
  return width
}

/**
 * A table that scrolls sideways on a phone, each edge fading while more columns sit past
 * it; the left one after the sticky name column. The container a
 * row's panel takes its width from: a panel stacks above the fades (`tablePanel`).
 * Last in its card, flush with the card's sides and bottom.
 */
export function TableScroll({ children }: { children: React.ReactNode }) {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const scroll = useScrollMore<HTMLDivElement>('x')
  const sticky = useStickyWidth(box)
  return (
    <div className="relative -mx-4 -mb-4 @container">
      <div
        ref={(node) => {
          setBox(node)
          scroll.ref(node)
        }}
        className="overflow-x-auto"
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(EDGE, 'bg-linear-to-l', !scroll.start && 'opacity-0')}
        style={{ left: sticky }}
      />
      <div
        aria-hidden="true"
        className={cn(
          EDGE,
          'right-0 bg-linear-to-r',
          !scroll.end && 'opacity-0',
        )}
      />
    </div>
  )
}

import { useState } from 'react'
import { barKey } from '#/components/dashboard/chart-parts'
import type { HoveredBar } from '#/components/dashboard/chart-parts'

/**
 * The bar part under the pointer, and the handlers that track it on each series' bars. A
 * click opens that part alone: its series and its bucket (author, 2026-11-20).
 */
export function useBarPointer(onOpen: (series: string, key: string) => void) {
  const [hovered, setHovered] = useState<HoveredBar>(null)
  const handlers = (series: string) => ({
    className: 'cursor-pointer',
    onMouseEnter: (data: unknown) => {
      const key = barKey(data)
      setHovered(key ? { series, key } : null)
    },
    onMouseLeave: () => setHovered(null),
    onClick: (data: unknown) => {
      const key = barKey(data)
      if (key) onOpen(series, key)
    },
  })
  const hoveredIn = (series: string) =>
    hovered?.series === series ? hovered.key : null
  return { handlers, hoveredIn }
}

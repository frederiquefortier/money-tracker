import { cn } from '#/lib/utils'

/**
 * A horizontal bar for a figure against the largest of its list. The figures stay
 * strings; the width alone is drawn from a number.
 */
export function ShareBar({
  value,
  max,
  color,
  className,
}: {
  value: string | null
  max: number
  color: string
  className?: string
}) {
  const amount = value === null ? 0 : Math.max(Number(value), 0)
  const width = max > 0 ? Math.max((amount / max) * 100, amount > 0 ? 1 : 0) : 0
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block h-2 overflow-hidden rounded-full bg-secondary',
        className,
      )}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </span>
  )
}

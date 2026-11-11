import type { TreeGuide } from '#/lib/shared/tree-layout'
import { cn } from '#/lib/utils'

const line = 'pointer-events-none absolute border-primary/30'

/**
 * The tree's elbow connectors in a list row: one slot per level, stretched over
 * the row's vertical padding (`className`, e.g. -my-2) so lines join between rows.
 */
export function TreeGuides({
  guide,
  className,
}: {
  guide: TreeGuide
  className?: string
}) {
  if (guide.depth === 0) return null
  return (
    <span aria-hidden="true" className={cn('flex self-stretch', className)}>
      {guide.continues.map((on, i) => (
        <span key={i} className="relative w-5 shrink-0">
          {on && <span className={cn(line, 'inset-y-0 left-2 border-l-2')} />}
        </span>
      ))}
      <span className="relative w-5 shrink-0">
        <span
          className={cn(
            line,
            'top-0 left-2 border-l-2',
            guide.last ? 'h-1/2' : 'bottom-0',
          )}
        />
        <span
          className={cn(line, '-right-2 top-1/2 left-2 -mt-px border-t-2')}
        />
      </span>
    </span>
  )
}

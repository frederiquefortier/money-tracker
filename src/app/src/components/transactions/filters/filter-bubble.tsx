import { Icon } from '#/components/display/icon'
import { chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

export const inUse = 'border-primary text-primary'

/**
 * A filter's bubble: always its name, "Catégories", with the number ticked after it,
 * "Catégories · 2" (what is ticked shows as chips); outlined in the accent while something
 * is ticked. It opens the filter sheet.
 */
export function FilterBubble({
  label,
  count,
  onOpen,
}: {
  label: string
  count: number
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={onOpen}
      className={cn(chipSurface, count > 0 && inUse)}
    >
      <span className="max-w-40 truncate">{label}</span>
      <Icon name="chevron-down" className="size-4" />
    </button>
  )
}

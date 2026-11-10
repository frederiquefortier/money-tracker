import { Icon } from '#/components/display/icon'
import { chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

export const inUse = 'border-primary text-primary'

/**
 * A filter's bubble: its name, or the one ticked (with `only.icon` before it), with a
 * chevron; outlined in the accent while something is ticked. It opens the filter sheet.
 */
export function FilterBubble({
  label,
  count,
  only,
  onOpen,
}: {
  label: string
  count: number
  only: { name: string; icon?: React.ReactNode } | null
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={onOpen}
      className={cn(chipSurface, count > 0 && inUse, only?.icon && 'pl-1')}
    >
      {only?.icon}
      <span className="max-w-40 truncate">{only?.name ?? label}</span>
      <Icon name="chevron-down" className="size-4" />
    </button>
  )
}

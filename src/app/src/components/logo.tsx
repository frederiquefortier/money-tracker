import { Icon } from '#/components/icon'
import { cn } from '#/lib/utils'

/** The pig in a blush badge. The name is visible beside it, or read only by screen readers. */
export function Logo({
  name,
  showName = true,
  size = 'md',
  className,
}: {
  name: string
  showName?: boolean
  size?: 'md' | 'lg'
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-full bg-secondary text-primary shadow-sm ring-1 ring-primary/10',
          size === 'lg' ? 'size-20' : 'size-9',
        )}
      >
        <Icon
          name="pig-fill"
          className={size === 'lg' ? 'size-11' : 'size-5'}
        />
      </span>
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          !showName && 'sr-only',
        )}
      >
        {name}
      </span>
    </span>
  )
}

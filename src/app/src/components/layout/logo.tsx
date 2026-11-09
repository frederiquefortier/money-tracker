import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { cn } from '#/lib/utils'

export function Logo({
  showName = true,
  size = 'md',
  className,
}: {
  showName?: boolean
  size?: 'md' | 'lg'
  className?: string
}) {
  const { t } = useTranslation()
  // The row is one badge tall and clips: when the name no longer fits beside the
  // badge it wraps to a second row and disappears, leaving the badge alone.
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2.5 overflow-hidden',
        size === 'lg' ? 'h-20' : 'h-9',
        className,
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-secondary text-primary ring-1 ring-primary/10 ring-inset',
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
          'font-mono text-lg font-bold tracking-wide whitespace-nowrap uppercase',
          !showName && 'sr-only',
        )}
      >
        {t('app.name')}
      </span>
    </span>
  )
}

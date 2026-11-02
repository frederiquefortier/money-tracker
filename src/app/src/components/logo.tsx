import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
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
        {t('app.name')}
      </span>
    </span>
  )
}

import { useTranslation } from 'react-i18next'
import { useLocale } from '#/hooks/app/use-locale'
import { formatCount } from '#/lib/shared/format'
import { cn } from '#/lib/utils'

/** How many items a list holds, beside its title. */
export function ListCount({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <span
      aria-label={t('common.total', { count })}
      className={cn('text-muted-foreground tabular-nums', className)}
    >
      {formatCount(count, locale)}
    </span>
  )
}

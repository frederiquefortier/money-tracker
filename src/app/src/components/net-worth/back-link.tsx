import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { cn } from '#/lib/utils'

/** Above the title of a page opened from a hub card: back to the hub. */
export function NetWorthBackLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/net-worth"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-lg text-sm font-semibold text-muted-foreground hover:text-primary',
        focusRing,
      )}
    >
      <Icon name="chevron-left" className="size-4" />
      {t('netWorth.back')}
    </Link>
  )
}

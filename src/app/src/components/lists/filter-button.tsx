import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { chipActive, chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

/** "Filtres", or "Filtres · 3" in the accent outline while some are ticked; opens their sheet. */
export function FilterButton({
  count,
  onOpen,
  className,
}: {
  count: number
  onOpen: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const name = t('transactions.list.filters')
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className={cn(chipSurface, count > 0 && chipActive, className)}
    >
      <Icon name="filter" className="size-4" />
      {count ? t('transactions.list.filterCount', { name, count }) : name}
    </button>
  )
}

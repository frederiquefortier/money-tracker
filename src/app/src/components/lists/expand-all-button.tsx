import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

/** Opens every collapsible section of a list, or closes them all once all are open. */
export function ExpandAllButton({
  allExpanded,
  onToggle,
}: {
  allExpanded: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const label = t(allExpanded ? 'common.collapseAll' : 'common.expandAll')
  return (
    <button
      type="button"
      className={cn(chipSurface, 'size-8 justify-center px-0')}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <Icon
        name={allExpanded ? 'unfold-less' : 'unfold-more'}
        className="size-5"
      />
    </button>
  )
}

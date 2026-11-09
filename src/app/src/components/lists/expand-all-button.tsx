import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { Button } from '#/components/ui/button'

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
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <Icon
        name={allExpanded ? 'unfold-less' : 'unfold-more'}
        className="size-5"
      />
    </Button>
  )
}

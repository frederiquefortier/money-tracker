import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'
import { SheetFooter } from '#/components/ui/sheet'

/** A filter sheet's footer: Effacer what is shown, and close on the results. */
export function FilterFooter({
  cleared,
  onClear,
  onClose,
}: {
  cleared?: boolean
  /** Left out where there is nothing to clear (the period). */
  onClear?: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <SheetFooter>
      {onClear && (
        <Button
          variant="ghost"
          className="mr-auto"
          disabled={cleared}
          onClick={onClear}
        >
          {t('common.clear')}
        </Button>
      )}
      <Button onClick={onClose}>{t('transactions.list.showResults')}</Button>
    </SheetFooter>
  )
}

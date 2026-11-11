import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { Button } from '#/components/ui/button'

/**
 * Forgets the merges, edits and people chosen for the new items, after asking: they take
 * time to make, and are kept in the browser until an import is written.
 */
export function ResetChoices({
  count,
  onReset,
}: {
  count: number
  onReset: () => void
}) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState(false)
  if (count === 0) return null
  return (
    <>
      <Button
        variant="outline"
        className="self-start"
        onClick={() => setAsking(true)}
      >
        {t('import.undoChoices', { count })}
      </Button>
      <ConfirmDialog
        open={asking}
        title={t('import.undoChoicesTitle')}
        description={t('import.undoChoicesDescription')}
        confirmLabel={t('import.undoChoicesConfirm')}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false)
          onReset()
        }}
      />
    </>
  )
}

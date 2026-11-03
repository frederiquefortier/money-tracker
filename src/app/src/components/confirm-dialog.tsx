import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'

/** Confirms a destructive action: "Supprimer {name}" in red, a red button, Annuler. */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  irreversible = true,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  confirmLabel: string
  /** Adds "Cette action est irréversible."; false for what can be undone. */
  irreversible?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        closeLabel={t('common.close')}
        {...(irreversible ? {} : { 'aria-describedby': undefined })}
      >
        <DialogTitle className="text-destructive">{title}</DialogTitle>
        {irreversible && (
          <DialogDescription>{t('common.irreversible')}</DialogDescription>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

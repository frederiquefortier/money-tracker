import { useTranslation } from 'react-i18next'
import { useMountedWhileOpen } from '#/hooks/app/use-mounted-while-open'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  title: string
  confirmLabel: string
  tone?: 'destructive' | 'default'
  /** Adds "Cette action est irréversible."; false for what can be undone. */
  irreversible?: boolean
  description?: string
  busy?: boolean
  canConfirm?: boolean
  onCancel: () => void
  onConfirm: () => void
  /** Runs once the closing animation has finished. */
  onClosed?: () => void
  children?: React.ReactNode
}

/**
 * Asks before an action. Destructive by default: "Supprimer {name}" in red, a red button,
 * Annuler. `description` says what is affected, before "Cette action est irréversible.";
 * `children` holds what the action needs, such as a date. Nothing is rendered before it
 * first opens.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { mounted, unmount } = useMountedWhileOpen(props.open)
  if (!mounted) return null
  return (
    <MountedConfirmDialog
      {...props}
      onClosed={() => {
        unmount()
        props.onClosed?.()
      }}
    />
  )
}

function MountedConfirmDialog({
  open,
  title,
  confirmLabel,
  tone = 'destructive',
  irreversible = tone === 'destructive',
  description,
  busy = false,
  canConfirm = true,
  onCancel,
  onConfirm,
  onClosed,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const destructive = tone === 'destructive'
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        closeLabel={t('common.close')}
        onCloseAutoFocus={onClosed}
        {...(irreversible || description
          ? {}
          : { 'aria-describedby': undefined })}
      >
        <DialogTitle className={destructive ? 'text-destructive' : undefined}>
          {title}
        </DialogTitle>
        {(irreversible || description) && (
          <DialogDescription>
            {[description, irreversible && t('common.irreversible')]
              .filter(Boolean)
              .join(' ')}
          </DialogDescription>
        )}
        {children}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy || !canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

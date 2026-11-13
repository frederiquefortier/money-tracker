import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { useServerAction } from '#/hooks/app/use-server-action'
import type { ServerActionOptions } from '#/hooks/app/use-server-action'
import type { Result } from '#/lib/shared/result'
import { useMountedWhileOpen } from '#/hooks/app/use-mounted-while-open'

type DeleteDialogProps = {
  open: boolean
  title: string
  description?: string
  failureText?: ServerActionOptions['failureText']
  onDelete: () => Promise<Result<string>>
  onClose: () => void
  children?: React.ReactNode
}

/**
 * Every delete from a row or a sheet: confirm, run, close. The title is asked as a
 * question, with no "irréversible" line; `description` says what stays.
 */
export function DeleteDialog(props: DeleteDialogProps) {
  const { mounted, unmount } = useMountedWhileOpen(props.open)
  if (!mounted) return null
  return <MountedDeleteDialog {...props} onClosed={unmount} />
}

function MountedDeleteDialog({
  open,
  title,
  description,
  failureText,
  onDelete,
  onClose,
  onClosed,
  children,
}: DeleteDialogProps & { onClosed: () => void }) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  return (
    <ConfirmDialog
      open={open}
      title={`${title}?`}
      irreversible={false}
      description={description}
      confirmLabel={t('common.delete')}
      busy={busy}
      onCancel={onClose}
      onConfirm={() => run(onDelete, { onResult: onClose, failureText })}
      onClosed={onClosed}
    >
      {children}
    </ConfirmDialog>
  )
}

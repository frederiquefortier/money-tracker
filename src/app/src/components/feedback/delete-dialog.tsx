import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { useServerAction } from '#/hooks/app/use-server-action'
import type { ServerActionOptions } from '#/hooks/app/use-server-action'
import type { Result } from '#/lib/shared/result'

/** Every delete from a row or a sheet: confirm, run, close. `children` says what stays. */
export function DeleteDialog({
  open,
  title,
  description,
  failureText,
  onDelete,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  failureText?: ServerActionOptions['failureText']
  onDelete: () => Promise<Result<string>>
  onClose: () => void
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel={t('common.delete')}
      busy={busy}
      onCancel={onClose}
      onConfirm={() => run(onDelete, { onResult: onClose, failureText })}
    >
      {children}
    </ConfirmDialog>
  )
}

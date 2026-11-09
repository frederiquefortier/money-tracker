import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchiveDialog } from '#/components/feedback/archive-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useServerAction } from '#/hooks/app/use-server-action'
import { closeAccount, deleteAccount, reopenAccount } from '#/server/accounts'
import type { Account } from '#/lib/accounts/account'

type RowAccount = Pick<Account, 'id' | 'name' | 'currency' | 'closedOn'>

/** Close or reopen (ACC-03) and delete, as icons on the account's row or its sheet. */
export function AccountActions({
  account,
  placement,
  className,
}: {
  account: RowAccount
  placement?: ActionPlacement
  className?: string
}) {
  const { t } = useTranslation()
  const { run } = useServerAction()
  const [dialog, setDialog] = useState<'close' | 'delete' | null>(null)
  const { id, name } = account
  const close = () => setDialog(null)
  const archiveLabel = t('common.archiveName', { name })
  const deleteLabel = t('common.deleteName', { name })
  const failureText = (error: string) =>
    error === 'currencyRemoved'
      ? t('accounts.currencyRemoved', { code: account.currency })
      : undefined

  return (
    <IconActions slots={2} placement={placement} className={className}>
      {account.closedOn ? (
        <IconButton
          icon="undo"
          label={t('common.reactivateName', { name })}
          onClick={() =>
            run(() => reopenAccount({ data: { id } }), { failureText })
          }
        />
      ) : (
        <IconButton
          icon="archive"
          label={archiveLabel}
          onClick={() => setDialog('close')}
        />
      )}
      <IconButton
        icon="trash-full"
        label={deleteLabel}
        onClick={() => setDialog('delete')}
      />
      {dialog === 'close' && (
        <ArchiveDialog
          title={archiveLabel}
          dateLabel={t('accounts.closedOnField')}
          failureText={failureText}
          onArchive={(closedOn) => closeAccount({ data: { id, closedOn } })}
          onClose={close}
        />
      )}
      <DeleteDialog
        open={dialog === 'delete'}
        title={deleteLabel}
        failureText={failureText}
        onDelete={() => deleteAccount({ data: { id } })}
        onClose={close}
      />
    </IconActions>
  )
}

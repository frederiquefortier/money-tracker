import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchiveDialog } from '#/components/feedback/archive-dialog'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useToast } from '#/hooks/app/use-toast'
import { useServerAction } from '#/hooks/app/use-server-action'
import { closeAccount, deleteAccount, reopenAccount } from '#/server/accounts'
import type { Account } from '#/lib/accounts/account'

type RowAccount = Pick<
  Account,
  'id' | 'name' | 'currency' | 'closedOn' | 'inUse'
>

/** Close or reopen (ACC-03) and delete, on the account's row, in its menu or its sheet. */
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
  const toast = useToast()
  const [dialog, setDialog] = useState<'close' | 'delete' | null>(null)
  const { id, name } = account
  const close = () => setDialog(null)
  const archiveLabel = t('common.archiveName', { name })
  const deleteLabel = t('common.deleteName', { name })
  const failureText = (error: string) => {
    if (error === 'inUse') return t('accounts.inUse')
    if (error === 'currencyRemoved')
      return t('accounts.currencyRemoved', { code: account.currency })
    return undefined
  }

  return (
    <>
      <IconActions
        slots={2}
        placement={placement}
        menuLabel={t('common.actionsOf', { name })}
        className={className}
      >
        {account.closedOn ? (
          <IconButton
            icon="undo"
            label={t('common.reactivateName', { name })}
            text={t('common.reactivate')}
            onClick={() =>
              run(() => reopenAccount({ data: { id } }), { failureText })
            }
          />
        ) : (
          <IconButton
            icon="archive"
            label={archiveLabel}
            text={t('common.archive')}
            onClick={() => setDialog('close')}
          />
        )}
        <IconButton
          icon="trash-full"
          text={t('common.delete')}
          label={account.inUse ? t('accounts.inUse') : deleteLabel}
          muted={account.inUse}
          onClick={() =>
            account.inUse
              ? toast({ text: t('accounts.inUse') })
              : setDialog('delete')
          }
        />
      </IconActions>
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
    </>
  )
}

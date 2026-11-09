import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { FormField } from '#/components/forms/form-field'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { useServerAction } from '#/hooks/app/use-server-action'
import { todayIso } from '#/lib/shared/format'
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
  const { run, busy } = useServerAction()
  const [dialog, setDialog] = useState<'close' | 'delete' | null>(null)
  const [closedOn, setClosedOn] = useState('')
  const { id, name } = account

  function save(call: Parameters<typeof run>[0]) {
    run(call, {
      onResult: () => setDialog(null),
      failureText: (error) =>
        error === 'currencyRemoved'
          ? t('accounts.currencyRemoved', { code: account.currency })
          : undefined,
    })
  }

  function startClosing() {
    setClosedOn(todayIso())
    setDialog('close')
  }

  return (
    <IconActions slots={2} placement={placement} className={className}>
      {account.closedOn ? (
        <IconButton
          icon="undo"
          label={t('common.reactivateName', { name })}
          onClick={() => save(() => reopenAccount({ data: { id } }))}
        />
      ) : (
        <IconButton
          icon="archive"
          label={t('common.archiveName', { name })}
          onClick={startClosing}
        />
      )}
      <IconButton
        icon="trash-full"
        label={t('common.deleteName', { name })}
        onClick={() => setDialog('delete')}
      />
      <ConfirmDialog
        open={dialog === 'close'}
        tone="default"
        title={t('common.archiveName', { name })}
        confirmLabel={t('common.archive')}
        busy={busy}
        canConfirm={closedOn !== ''}
        onCancel={() => setDialog(null)}
        onConfirm={() => save(() => closeAccount({ data: { id, closedOn } }))}
      >
        <FormField
          name="closedOn"
          type="date"
          required
          label={t('accounts.closedOnField')}
          value={closedOn}
          onChange={(event) => setClosedOn(event.target.value)}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('common.deleteName', { name })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => save(() => deleteAccount({ data: { id } }))}
      />
    </IconActions>
  )
}

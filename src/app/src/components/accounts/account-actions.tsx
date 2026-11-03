import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormField } from '#/components/form-field'
import { IconActions, IconButton } from '#/components/icon-button'
import { useServerAction } from '#/components/use-server-action'
import { todayIso } from '#/lib/format'
import { closeAccount, deleteAccount, reopenAccount } from '#/server/accounts'
import type { Account } from '#/server/accounts'

type RowAccount = Pick<Account, 'id' | 'name' | 'currency' | 'closedOn'>

/** Close or reopen (ACC-03) and delete, as icons on the account's row. */
export function AccountActions({
  account,
  className,
}: {
  account: RowAccount
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
    <IconActions slots={2} className={className}>
      {account.closedOn ? (
        <IconButton
          icon="undo"
          label={t('accounts.reopenName', { name })}
          onClick={() => save(() => reopenAccount({ data: { id } }))}
        />
      ) : (
        <IconButton
          icon="archive"
          label={t('accounts.closeName', { name })}
          onClick={startClosing}
        />
      )}
      <IconButton
        icon="trash"
        label={t('accounts.deleteConfirm', { name })}
        onClick={() => setDialog('delete')}
      />
      <ConfirmDialog
        open={dialog === 'close'}
        tone="default"
        title={t('accounts.closeName', { name })}
        confirmLabel={t('accounts.close')}
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
        title={t('accounts.deleteConfirm', { name })}
        confirmLabel={t('accounts.delete')}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => save(() => deleteAccount({ data: { id } }))}
      />
    </IconActions>
  )
}

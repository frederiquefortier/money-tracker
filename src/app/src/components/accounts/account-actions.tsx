import { useState, useTransition } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormField } from '#/components/form-field'
import { IconActions, IconButton } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import { closeAccount, deleteAccount, reopenAccount } from '#/server/accounts'
import type { Account } from '#/server/accounts'

const today = () => new Date().toISOString().slice(0, 10)

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
  const router = useRouter()
  const toast = useToast()
  const [dialog, setDialog] = useState<'close' | 'delete' | null>(null)
  const [busy, start] = useTransition()

  function run(call: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const result = await call()
      setDialog(null)
      if (result.ok) await router.invalidate()
      else
        toast({
          text:
            result.error === 'currencyRemoved'
              ? t('accounts.currencyRemoved', { code: account.currency })
              : t('common.saveFailed'),
        })
    })
  }

  const { id } = account
  return (
    <IconActions slots={2} className={className}>
      {account.closedOn ? (
        <IconButton
          icon="undo"
          label={t('accounts.reopenName', { name: account.name })}
          onClick={() => run(() => reopenAccount({ data: { id } }))}
        />
      ) : (
        <IconButton
          icon="archive"
          label={t('accounts.closeName', { name: account.name })}
          onClick={() => setDialog('close')}
        />
      )}
      <IconButton
        icon="trash"
        label={t('accounts.deleteConfirm', { name: account.name })}
        onClick={() => setDialog('delete')}
      />
      <CloseDialog
        open={dialog === 'close'}
        name={account.name}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={(closedOn) =>
          run(() => closeAccount({ data: { id, closedOn } }))
        }
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('accounts.deleteConfirm', { name: account.name })}
        confirmLabel={t('accounts.delete')}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => deleteAccount({ data: { id } }))}
      />
    </IconActions>
  )
}

function CloseDialog({
  open,
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  name: string
  busy: boolean
  onCancel: () => void
  onConfirm: (closedOn: string) => void
}) {
  const { t } = useTranslation()
  const [closedOn, setClosedOn] = useState(today)
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        closeLabel={t('common.close')}
        aria-describedby={undefined}
      >
        <DialogTitle>{t('accounts.closeName', { name })}</DialogTitle>
        <FormField
          name="closedOn"
          type="date"
          required
          label={t('accounts.closedOnField')}
          value={closedOn}
          onChange={(event) => setClosedOn(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={busy || !closedOn}
            onClick={() => onConfirm(closedOn)}
          >
            {t('accounts.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

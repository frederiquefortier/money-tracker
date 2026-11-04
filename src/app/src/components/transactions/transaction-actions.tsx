import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { IconActions, IconButton } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useServerAction } from '#/components/use-server-action'
import { deleteTransaction } from '#/server/transactions'

/** Delete, on the transaction's row (spec 14) or in its sheet on phones. */
export function TransactionActions({
  transactionId,
  placement,
}: {
  transactionId: string
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [confirming, setConfirming] = useState(false)
  const title = t('transactions.deleteTitle')

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={title}
        onClick={() => setConfirming(true)}
      />
      <ConfirmDialog
        open={confirming}
        title={title}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(() => deleteTransaction({ data: { id: transactionId } }), {
            onResult: () => setConfirming(false),
          })
        }
      />
    </IconActions>
  )
}

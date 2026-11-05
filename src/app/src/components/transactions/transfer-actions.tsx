import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { IconActions, IconButton } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useServerAction } from '#/components/use-server-action'
import { accountLabel } from '#/lib/accounts'
import { formatDate, formatMoney } from '#/lib/format'
import { absDecimal } from '#/lib/money'
import { useLocale } from '#/lib/use-locale'
import { deleteTransfer } from '#/server/transfers'

type Account = { name: string; institution: string | null }

/** What tells one transfer from another before deleting it. */
export type TransferSummary = {
  transferId: string
  occurredOn: string
  amount: string
  currency: string
  from: Account
  to: Account
  /** Unknown on a list row, whose fee may be filtered out. */
  hasFee: boolean | null
}

const TEXT_KEYS = {
  true: 'transactions.transfer.deleteWithFee',
  false: 'transactions.transfer.deleteText',
  null: 'transactions.transfer.deleteMaybeFee',
} as const

/** Delete, on the transfer's row (spec 14) or in its sheet on phones (TRX-04). */
export function TransferActions({
  summary,
  placement,
}: {
  summary: TransferSummary
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { run, busy } = useServerAction()
  const [confirming, setConfirming] = useState(false)
  const quoted = (account: Account) => `“${accountLabel(account)}”`

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={t('transactions.transfer.deleteLabel')}
        onClick={() => setConfirming(true)}
      />
      <ConfirmDialog
        open={confirming}
        title={t('transactions.transfer.deleteTitle', {
          amount: formatMoney(
            absDecimal(summary.amount),
            summary.currency,
            locale,
          ),
          date: formatDate(summary.occurredOn, locale),
        })}
        description={t(TEXT_KEYS[`${summary.hasFee}`], {
          from: quoted(summary.from),
          to: quoted(summary.to),
        })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(() => deleteTransfer({ data: { id: summary.transferId } }), {
            onResult: () => setConfirming(false),
          })
        }
      />
    </IconActions>
  )
}

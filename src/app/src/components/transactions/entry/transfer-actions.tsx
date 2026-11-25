import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { accountLabel } from '#/lib/accounts/account'
import { formatDate, formatQuoted } from '#/lib/shared/format'
import { absDecimal } from '#/lib/shared/money'
import { useLocale } from '#/hooks/app/use-locale'
import { useMoneyText } from '#/hooks/app/use-privacy'
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

/** Delete, on the transfer's row or in its sheet on phones (TRX-04). */
export function TransferActions({
  summary,
  placement,
}: {
  summary: TransferSummary
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const moneyText = useMoneyText()
  const [confirming, setConfirming] = useState(false)
  const quoted = (account: Account) => formatQuoted(accountLabel(account))

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={t('transactions.transfer.deleteLabel')}
        onClick={() => setConfirming(true)}
      />
      <DeleteDialog
        open={confirming}
        title={t('transactions.transfer.deleteTitle', {
          amount: moneyText(absDecimal(summary.amount), summary.currency),
          date: formatDate(summary.occurredOn, locale),
        })}
        description={t(TEXT_KEYS[`${summary.hasFee}`], {
          from: quoted(summary.from),
          to: quoted(summary.to),
        })}
        onDelete={() => deleteTransfer({ data: { id: summary.transferId } })}
        onClose={() => setConfirming(false)}
      />
    </IconActions>
  )
}

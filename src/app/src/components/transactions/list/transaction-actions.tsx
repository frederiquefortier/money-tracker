import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { accountLabel } from '#/lib/accounts/account'
import {
  formatDate,
  formatMoney,
  formatQuoted,
  formatQuotedList,
} from '#/lib/shared/format'
import { absDecimal } from '#/lib/shared/money'
import { useLocale } from '#/hooks/app/use-locale'
import { deleteTransaction } from '#/server/transactions'

/** What tells one transaction from another before deleting it. */
export type TransactionSummary = {
  id: string
  occurredOn: string
  amount: string
  currency: string
  merchant: string | null
  categories: ReadonlyArray<string>
  account: { name: string; institution: string | null }
}

/**
 * "Supprimer la transaction de 45,00 $ du 3 novembre 2026 chez “Épicerie du coin”", then
 * the account and the categories it went to.
 */
function useDeleteText(summary: TransactionSummary) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { merchant, categories } = summary
  return {
    title: t(
      merchant ? 'transactions.deleteTitleAt' : 'transactions.deleteTitleOn',
      {
        amount: formatMoney(
          absDecimal(summary.amount),
          summary.currency,
          locale,
        ),
        date: formatDate(summary.occurredOn, locale),
        merchant,
      },
    ),
    description: t(
      categories.length > 0
        ? 'transactions.deleteCategories'
        : 'transactions.deleteAccount',
      {
        account: formatQuoted(accountLabel(summary.account)),
        categories: formatQuotedList(categories, locale),
        count: categories.length,
      },
    ),
  }
}

/** Delete, on the transaction's row or in its sheet on phones. */
export function TransactionActions({
  summary,
  placement,
}: {
  summary: TransactionSummary
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const text = useDeleteText(summary)

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={t('transactions.deleteTitle')}
        onClick={() => setConfirming(true)}
      />
      <DeleteDialog
        open={confirming}
        title={text.title}
        description={text.description}
        onDelete={() => deleteTransaction({ data: { id: summary.id } })}
        onClose={() => setConfirming(false)}
      />
    </IconActions>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { IconActions, IconButton } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useServerAction } from '#/components/use-server-action'
import { formatDate, formatMoney, formatQuotedList } from '#/lib/format'
import { absDecimal } from '#/lib/money'
import { useLocale } from '#/lib/use-locale'
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
  const { name, institution } = summary.account
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
        account: institution ? `“${name}” (${institution})` : `“${name}”`,
        categories: formatQuotedList(categories, locale),
        count: categories.length,
      },
    ),
  }
}

/** Delete, on the transaction's row (spec 14) or in its sheet on phones. */
export function TransactionActions({
  summary,
  placement,
}: {
  summary: TransactionSummary
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [confirming, setConfirming] = useState(false)
  const label = t('transactions.deleteTitle')
  const text = useDeleteText(summary)

  return (
    <IconActions slots={1} placement={placement}>
      <IconButton
        icon="trash-full"
        label={label}
        onClick={() => setConfirming(true)}
      />
      <ConfirmDialog
        open={confirming}
        title={text.title}
        description={text.description}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(() => deleteTransaction({ data: { id: summary.id } }), {
            onResult: () => setConfirming(false),
          })
        }
      />
    </IconActions>
  )
}

import { useTranslation } from 'react-i18next'
import { accountLabel } from '#/lib/accounts/account'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { holdingLabel } from '#/lib/holdings/holding'
import type { ListedTransaction } from '#/lib/transactions/transaction-list'

/** The title, then the muted line: categories, account and note. */
export function useRowText(row: ListedTransaction) {
  const { t } = useTranslation()
  const locale = useLocale()
  const categories = row.categories.map((c) => c.name).join(', ')
  const join = (parts: Array<string | null | undefined>) =>
    parts.filter(Boolean).join(' · ')
  const accounts = row.transfer && {
    from: accountLabel(row.transfer.from),
    to: accountLabel(row.transfer.to),
  }
  if (accounts && row.kind === 'transfer')
    return {
      title: t('transactions.list.transfer', accounts),
      details: row.note ?? '',
    }
  // A fee has its own row only when filtering on categories.
  if (accounts)
    return {
      title: t('transactions.list.transferFee', accounts),
      details: join([categories, row.note]),
    }
  if (row.kind === 'adjustment')
    return {
      title: t('transactions.list.adjustment'),
      details: join([accountLabel(row.account), row.note]),
    }
  // what an income pays back, first on its line.
  const reimburses = row.reimburses
    .map((r) =>
      [r.label, formatDate(r.date, locale, 'medium')]
        .filter(Boolean)
        .join(', '),
    )
    .join('; ')
  // A holding names the transaction as a store does.
  const name =
    row.merchant ??
    (row.holding
      ? holdingLabel(row.holding, locale, { currency: false })
      : null)
  return {
    title: name ?? categories,
    details: join([
      reimburses && t('transactions.list.reimburses', { what: reimburses }),
      name ? categories : '',
      accountLabel(row.account),
      row.note,
    ]),
  }
}

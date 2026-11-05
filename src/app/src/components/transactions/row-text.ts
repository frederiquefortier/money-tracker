import { useTranslation } from 'react-i18next'
import { accountLabel } from '#/lib/accounts'
import type { ListedTransaction } from '#/lib/transaction-list'

/** The title, then the muted line: categories, account and note. */
export function useRowText(row: ListedTransaction) {
  const { t } = useTranslation()
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
  return {
    title: row.merchant ?? categories,
    details: join([
      row.merchant ? categories : '',
      accountLabel(row.account),
      row.note,
    ]),
  }
}

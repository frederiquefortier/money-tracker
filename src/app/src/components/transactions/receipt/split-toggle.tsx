import { useTranslation } from 'react-i18next'
import { slipSmall } from '#/components/transactions/receipt/receipt-line'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

type Update = (changes: Partial<TransactionDraft>) => void

/** Répartir itemizes the slip; in the same place, "Ne pas répartir" goes back. */
export function SplitToggle({
  draft,
  onChange,
}: {
  draft: TransactionDraft
  onChange: Update
}) {
  const { t } = useTranslation()
  const split = draft.splitMode !== null
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          split
            ? {
                splitMode: null,
                lines: [],
                categoryId: draft.lines[0]?.categoryId ?? null,
              }
            : {
                splitMode: 'amount',
                lines: [
                  { key: 0, categoryId: draft.categoryId, value: '' },
                  { key: 1, categoryId: null, value: '' },
                ],
              },
        )
      }
      className={cn(
        'self-start rounded-sm font-semibold tracking-wide text-primary uppercase underline decoration-transparent transition-colors hover:decoration-current',
        slipSmall,
        focusRing,
      )}
    >
      {t(split ? 'transactions.unsplit' : 'transactions.split')}
    </button>
  )
}

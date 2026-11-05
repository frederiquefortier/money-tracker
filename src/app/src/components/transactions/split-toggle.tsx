import { useTranslation } from 'react-i18next'
import { small } from '#/components/transactions/receipt-line'
import type { Draft } from '#/lib/transaction-draft'
import { cn, focusRing } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** Répartir itemizes the slip; in the same place, "Ne pas répartir" goes back. */
export function SplitToggle({
  draft,
  onChange,
}: {
  draft: Draft
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
        small,
        focusRing,
      )}
    >
      {t(split ? 'transactions.unsplit' : 'transactions.split')}
    </button>
  )
}

import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { CheckList } from '#/components/forms/check-list'
import { LinkedFields } from '#/components/forms/linked-fields'
import { Money } from '#/components/display/money'
import { FieldLabel } from '#/components/ui/field'
import type { Category } from '#/lib/categories/category'
import { formatDate } from '#/lib/shared/format'
import { sourceOf } from '#/lib/transactions/transaction-source'
import { useLocale } from '#/hooks/app/use-locale'
import { getOwedLines } from '#/server/owed'
import { useToast } from '#/hooks/app/use-toast'
import { useMarkChanged } from '#/hooks/forms/use-sheet'
import type { OwedLine } from '#/lib/people/owed'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

/** The person's owed lines, loaded again when the income's source changes. */
function useOwedLines(personId: string | null, incomeId: string | undefined) {
  const { t } = useTranslation()
  const toast = useToast()
  const [lines, setLines] = useState<Array<OwedLine>>([])
  useEffect(() => {
    if (!personId) return setLines([])
    let current = true
    getOwedLines({ data: { personId, incomeId } })
      .then((found) => current && setLines(found))
      .catch(() => toast({ text: t('common.genericError'), tone: 'error' }))
    return () => {
      current = false
    }
  }, [personId, incomeId, toast, t])
  return lines
}

/** The expense's category icon, as on its row; an empty circle without one. */
function LineBadge({ category }: { category: Category | undefined }) {
  if (!category)
    return (
      <span
        aria-hidden="true"
        className="size-9 shrink-0 rounded-full border border-dashed"
      />
    )
  return <CategoryBadge icon={category.icon} color={category.color} />
}

/**
 * TRX-07, on an income with its Proche, on the line of fields linked to it:
 * the owed lines it pays back, drawn like transaction rows (the category, the merchant,
 * the date, what is left), ticked in the order the money goes to them. The first ticked
 * gives its expense's category, as a refund, unless one was chosen by hand.
 */
export function ReimbursesField({
  id,
  draft,
  categories,
  onChange,
}: {
  id?: string
  draft: TransactionDraft
  categories: ReadonlyArray<Category>
  onChange: (changes: Partial<TransactionDraft>) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const markChanged = useMarkChanged()
  const labelId = useId()
  const lines = useOwedLines(sourceOf(draft), id)
  if (lines.length === 0) return null

  function toggle(line: OwedLine) {
    markChanged()
    const on = draft.reimburses.includes(line.id)
    const reimburses = on
      ? draft.reimburses.filter((x) => x !== line.id)
      : [...draft.reimburses, line.id]
    const refund =
      !on &&
      draft.reimburses.length === 0 &&
      !draft.categoryByHand &&
      draft.splitMode === null &&
      line.categoryId
    onChange({ reimburses, ...(refund ? { categoryId: line.categoryId } : {}) })
  }

  return (
    <LinkedFields>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex flex-col gap-2"
      >
        <FieldLabel id={labelId}>
          {t('transactions.people.reimburses')}
        </FieldLabel>
        <CheckList
          small
          nodes={lines.map((line) => ({
            id: line.id,
            icon: (
              <LineBadge
                category={categories.find((c) => c.id === line.categoryId)}
              />
            ),
            label: line.label,
            detail: formatDate(line.occurredOn, locale, 'medium'),
            aside: (
              <span className="shrink-0 text-right font-mono text-sm font-semibold">
                {line.left === null ? (
                  t('transactions.people.unknownShort')
                ) : (
                  <Money amount={line.left} currency={line.currency} />
                )}
              </span>
            ),
          }))}
          stateOf={(node) =>
            draft.reimburses.includes(node.id) ? 'on' : 'off'
          }
          onToggle={(node) => {
            const line = lines.find((l) => l.id === node.id)
            if (line) toggle(line)
          }}
        />
      </div>
    </LinkedFields>
  )
}

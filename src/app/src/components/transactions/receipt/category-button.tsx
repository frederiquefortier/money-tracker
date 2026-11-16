import { useTranslation } from 'react-i18next'
import {
  CategoryBadge,
  EmptyCategoryBadge,
} from '#/components/categories/category-badge'
import { EditHint } from '#/components/forms/edit-hint'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import type { TransactionKind } from '#/lib/transactions/transaction'
import { cn } from '#/lib/utils'
import { indexById } from '#/lib/shared/collections'
import { focusRing } from '#/components/styles'

/**
 * the category as a round button, on the receipt beside the amount or on a split
 * line. Empty, a dashed circle with a plus. Tapping it opens the category list. With
 * `label`, the circle and its name are one button, the gap between them included. The
 * name, and "Remboursement" for an income on an expense category, is its tooltip and
 * accessible name.
 */
export function CategoryButton({
  category,
  categories,
  kind,
  invalid,
  className = 'size-11 md:size-9',
  hint = 'sm',
  label,
  onOpen,
}: {
  category: Category | undefined
  categories: ReadonlyArray<Category>
  kind: TransactionKind
  invalid: boolean
  /** The circle's size: a field's height by default. */
  className?: string
  /** The pencil shown on hover, scaled to the circle (the category form's). */
  hint?: 'xs' | 'sm'
  /** A visible name beside the circle (split lines). */
  label?: string
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const byId = indexById(categories)
  const refund = category && kind === 'income' && category.kind !== 'income'
  const name = category
    ? categoryPath(category, byId)
    : t('transactions.chooseCategory')
  const title = `${t('transactions.category')}: ${name}${refund ? ` (${t('transactions.refund')})` : ''}`
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      title={title}
      aria-invalid={invalid || undefined}
      className={cn(
        'group flex shrink-0 items-center gap-2 text-left',
        label ? 'min-w-0 flex-1 rounded-lg' : 'rounded-full',
        focusRing,
      )}
    >
      <span className="relative shrink-0">
        {category ? (
          <>
            <CategoryBadge
              icon={category.icon}
              color={category.color}
              className={className}
            />
            <EditHint size={hint} />
          </>
        ) : (
          <EmptyCategoryBadge invalid={invalid} className={className} />
        )}
        {!category && <EditHint size={hint} icon="plus" />}
      </span>
      {label && (
        <span
          className={cn(
            'min-w-0 flex-1 truncate underline decoration-transparent transition-colors group-hover:decoration-current',
            !category && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      )}
    </button>
  )
}

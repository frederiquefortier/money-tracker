import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldMessage } from '#/components/forms/form-field'
import { IconButton } from '#/components/display/icon-button'
import { Money } from '#/components/display/money'
import { TabList } from '#/components/lists/tab-list'
import { CategoryButton } from '#/components/transactions/receipt/category-button'
import {
  slipSmall,
  slipTyped,
} from '#/components/transactions/receipt/receipt-line'
import { SplitRemaining } from '#/components/transactions/receipt/receipt-remaining'
import { categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { fromMinor, minorDigits } from '#/lib/shared/money'
import {
  capPercent,
  splitPreview,
} from '#/lib/transactions/transaction-preview'
import { SPLIT_MODES } from '#/lib/transactions/transaction'
import type { SplitMode } from '#/lib/transactions/transaction'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import { indexById } from '#/lib/shared/collections'
import type {
  DraftUpdate,
  TransactionDraft,
  SplitLine,
} from '#/lib/transactions/transaction-draft-types'
import type { PickTarget } from '#/components/transactions/receipt/receipt-line'

/** Removing down to one line goes back to the single category. */
function withoutSplitLine(
  lines: ReadonlyArray<SplitLine>,
  key: number,
): Partial<TransactionDraft> {
  const kept = lines.filter((l) => l.key !== key)
  if (kept.length > 1) return { lines: kept }
  return { splitMode: null, lines: [], categoryId: kept[0]?.categoryId ?? null }
}

/** What the line holds as typed, and in Parts and % what that comes to. */
export function LineValue({
  value,
  label,
  mode,
  computed,
  accountCurrency,
  placeholder,
  showComputed = mode !== 'amount',
  onChange,
}: {
  value: string
  label: string
  mode: SplitMode
  computed: bigint | null | undefined
  accountCurrency: string
  /** Shown while empty: "?" on a part not known yet. */
  placeholder?: string
  /** What the line comes to, under it: in Parts and %, or an empty Montant line. */
  showComputed?: boolean
  onChange: (value: string) => void
}) {
  return (
    <span className="flex flex-col items-end">
      <input
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(slipTyped, 'w-20')}
      />
      {showComputed && computed != null && (
        <Money
          amount={fromMinor(computed, minorDigits(accountCurrency))}
          currency={accountCurrency}
          className={cn(slipSmall, 'text-muted-foreground')}
        />
      )}
    </span>
  )
}

function SplitRow({
  line,
  n,
  draft,
  categories,
  computed,
  accountCurrency,
  onChange,
  onPick,
}: {
  line: SplitLine
  n: number
  draft: TransactionDraft
  categories: ReadonlyArray<Category>
  computed: bigint | null | undefined
  accountCurrency: string
  onChange: DraftUpdate
  onPick: (target: PickTarget) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const category = categories.find((c) => c.id === line.categoryId)
  const byId = indexById(categories)
  const setValue = (value: string) =>
    onChange({
      lines: draft.lines.map((l) =>
        l.key === line.key
          ? {
              ...l,
              value:
                draft.splitMode === 'percent'
                  ? capPercent(draft.lines, { key: l.key, value }, locale)
                  : value,
            }
          : l,
      ),
    })
  return (
    <li className="flex items-center gap-2 text-sm">
      <CategoryButton
        category={category}
        categories={categories}
        kind={draft.kind}
        invalid={false}
        className="size-9 md:size-9"
        hint="xs"
        label={
          category
            ? categoryPath(category, byId)
            : t('transactions.chooseCategory')
        }
        onOpen={() => onPick(line.key)}
      />
      <LineValue
        value={line.value}
        label={t('transactions.lineValue', { n })}
        mode={draft.splitMode ?? 'amount'}
        computed={computed}
        accountCurrency={accountCurrency}
        onChange={setValue}
      />
      <IconButton
        icon="close"
        label={t('transactions.removeLine')}
        onClick={() => onChange(withoutSplitLine(draft.lines, line.key))}
      />
    </li>
  )
}

/** "Par" and the three modes, in one line of the slip: the splits' or the people's. */
export function ModeLine({
  value,
  label,
  idPrefix,
  onSelect,
}: {
  value: SplitMode
  label: string
  idPrefix: string
  onSelect: (mode: SplitMode) => void
}) {
  const { t } = useTranslation()
  const panelId = useId()
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="tracking-wide uppercase">{t('transactions.by')}</span>
      <div className="flex-1" id={panelId}>
        <TabList
          label={label}
          tabs={SPLIT_MODES}
          value={value}
          labelOf={(m) => t(`transactions.modes.${m}`)}
          panelId={panelId}
          idPrefix={idPrefix}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}

/**
 * TRX-06: the slip itemized. One line per category with its round icon (the category
 * list again) and its value; Montant lines are in the account's currency and must leave
 * nothing; shares and percentages show what each comes to.
 */
export function SplitLines({
  draft,
  categories,
  total,
  accountCurrency,
  error,
  onChange,
  onPick,
}: {
  draft: TransactionDraft
  categories: ReadonlyArray<Category>
  total: bigint | null
  accountCurrency: string
  error: string | undefined
  onChange: DraftUpdate
  onPick: (target: PickTarget) => void
}) {
  const { t } = useTranslation()
  const { amounts, remaining } = splitPreview(draft, total, accountCurrency)
  const nextKey = Math.max(0, ...draft.lines.map((l) => l.key)) + 1
  return (
    <>
      <ModeLine
        value={draft.splitMode ?? 'amount'}
        label={t('transactions.splitBy')}
        idPrefix="split"
        onSelect={(splitMode) =>
          onChange({
            splitMode,
            lines: draft.lines.map((l) => ({ ...l, value: '' })),
          })
        }
      />
      <ul className="flex flex-col gap-2">
        {draft.lines.map((line, i) => (
          <SplitRow
            key={line.key}
            {...{ line, draft, categories, accountCurrency, onChange, onPick }}
            n={i + 1}
            computed={amounts[i]}
          />
        ))}
      </ul>
      {/* Under the column of ✕; a new line opens the category list for it. */}
      <div className="flex justify-end">
        <IconButton
          icon="plus"
          label={t('transactions.addLine')}
          onClick={() => {
            onChange({
              lines: [
                ...draft.lines,
                { key: nextKey, categoryId: null, value: '' },
              ],
            })
            onPick(nextKey)
          }}
        />
      </div>
      {/* Always there in % mode; in Montant once there is an amount to share. */}
      {(remaining !== null || draft.splitMode === 'percent') &&
        draft.splitMode !== 'share' && (
          <SplitRemaining
            mode={draft.splitMode ?? 'amount'}
            values={draft.lines.map((l) => l.value)}
            remaining={remaining}
            accountCurrency={accountCurrency}
          />
        )}
      {error && <FieldMessage>{error}</FieldMessage>}
    </>
  )
}

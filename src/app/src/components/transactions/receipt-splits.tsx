import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldMessage } from '#/components/form-field'
import { IconButton } from '#/components/icon-button'
import { Money } from '#/components/money'
import { TabList } from '#/components/tab-list'
import { CategoryButton } from '#/components/transactions/category-field'
import type { PickTarget } from '#/components/transactions/receipt-amount'
import { small, typed } from '#/components/transactions/receipt-line'
import { SplitRemaining } from '#/components/transactions/receipt-remaining'
import { categoryPath } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import { fromMinor, minorDigits } from '#/lib/money'
import { capPercent, splitPreview } from '#/lib/transaction-preview'
import type { Draft, Line } from '#/lib/transaction-draft'
import { SPLIT_MODES } from '#/lib/transactions'
import type { SplitMode } from '#/lib/transactions'
import { useLocale } from '#/lib/use-locale'
import { cn, indexById } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** Removing down to one line goes back to the single category (spec 15). */
function withoutLine(lines: ReadonlyArray<Line>, key: number): Partial<Draft> {
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
  onChange,
}: {
  value: string
  label: string
  mode: SplitMode
  computed: bigint | null | undefined
  accountCurrency: string
  onChange: (value: string) => void
}) {
  return (
    <span className="flex flex-col items-end">
      <input
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(typed, 'w-20')}
      />
      {mode !== 'amount' && computed != null && (
        <Money
          amount={fromMinor(computed, minorDigits(accountCurrency))}
          currency={accountCurrency}
          className={cn(small, 'text-muted-foreground')}
        />
      )}
    </span>
  )
}

function SplitLine({
  line,
  n,
  draft,
  categories,
  computed,
  accountCurrency,
  onChange,
  onPick,
}: {
  line: Line
  n: number
  draft: Draft
  categories: ReadonlyArray<Category>
  computed: bigint | null | undefined
  accountCurrency: string
  onChange: Update
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
        onClick={() => onChange(withoutLine(draft.lines, line.key))}
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
  draft: Draft
  categories: ReadonlyArray<Category>
  total: bigint | null
  accountCurrency: string
  error: string | undefined
  onChange: Update
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
          <SplitLine
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

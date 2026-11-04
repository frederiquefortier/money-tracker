import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldMessage } from '#/components/form-field'
import { EditHint } from '#/components/edit-hint'
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
import { capPercent } from '#/lib/transaction-draft'
import type { Draft, Line } from '#/lib/transaction-draft'
import { splitPreview } from '#/lib/transaction-preview'
import { SPLIT_MODES } from '#/lib/transactions'
import type { SplitMode } from '#/lib/transactions'
import { useLocale } from '#/lib/use-locale'
import { cn, focusRing } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** Removing down to one line goes back to the single category (spec 15). */
function withoutLine(lines: ReadonlyArray<Line>, key: number): Partial<Draft> {
  const kept = lines.filter((l) => l.key !== key)
  if (kept.length > 1) return { lines: kept }
  return { splitMode: null, lines: [], categoryId: kept[0]?.categoryId ?? null }
}

/** What the line holds as typed, and in Parts and % what that comes to. */
function LineValue({
  line,
  n,
  mode,
  computed,
  accountCurrency,
  onChange,
}: {
  line: Line
  n: number
  mode: SplitMode
  computed: bigint | null | undefined
  accountCurrency: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-col items-end">
      <input
        aria-label={t('transactions.lineValue', { n })}
        inputMode="decimal"
        autoComplete="off"
        value={line.value}
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
  const byId = new Map(categories.map((c) => [c.id, c]))
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
        line={line}
        n={n}
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

/** "Par" and the three modes, in one line of the slip. */
function ModeLine({ draft, onChange }: { draft: Draft; onChange: Update }) {
  const { t } = useTranslation()
  const panelId = useId()
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="tracking-wide uppercase">{t('transactions.by')}</span>
      <div className="flex-1" id={panelId}>
        <TabList
          label={t('transactions.splitBy')}
          tabs={SPLIT_MODES}
          value={draft.splitMode ?? 'amount'}
          labelOf={(m) => t(`transactions.modes.${m}`)}
          panelId={panelId}
          idPrefix="split"
          onSelect={(splitMode) =>
            onChange({
              splitMode,
              lines: draft.lines.map((l) => ({ ...l, value: '' })),
            })
          }
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
      <ModeLine draft={draft} onChange={onChange} />
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
      {/* A new line opens the category list for it, like every round icon. */}
      <button
        type="button"
        aria-label={t('transactions.addLine')}
        title={t('transactions.addLine')}
        onClick={() => {
          onChange({
            lines: [
              ...draft.lines,
              { key: nextKey, categoryId: null, value: '' },
            ],
          })
          onPick(nextKey)
        }}
        className={cn(
          'relative size-9 self-start rounded-full border-2 border-dashed border-primary/40 transition-colors hover:border-primary focus-visible:border-primary',
          focusRing,
        )}
      >
        <EditHint size="xs" icon="plus" />
      </button>
      {/* Always there in % mode; in Montant once there is an amount to share. */}
      {(remaining !== null || draft.splitMode === 'percent') &&
        draft.splitMode !== 'share' && (
          <SplitRemaining
            draft={draft}
            remaining={remaining}
            accountCurrency={accountCurrency}
          />
        )}
      {error && <FieldMessage>{error}</FieldMessage>}
    </>
  )
}

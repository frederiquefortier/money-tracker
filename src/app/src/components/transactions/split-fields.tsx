import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { FieldMessage } from '#/components/form-field'
import { Icon } from '#/components/icon'
import { IconButton } from '#/components/icon-button'
import { Money } from '#/components/money'
import { TabList } from '#/components/tab-list'
import { Button } from '#/components/ui/button'
import { fieldControl } from '#/components/ui/field'
import type { Category } from '#/lib/categories'
import { fromMinor, minorDigits } from '#/lib/money'
import { capPercent } from '#/lib/transaction-draft'
import type { Draft, Line } from '#/lib/transaction-draft'
import { splitPreview } from '#/lib/transaction-preview'
import { SPLIT_MODES } from '#/lib/transactions'
import { useLocale } from '#/lib/use-locale'
import { cn } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** Removing down to one line goes back to the single category field (spec 15). */
function withoutLine(lines: ReadonlyArray<Line>, key: number): Partial<Draft> {
  const kept = lines.filter((l) => l.key !== key)
  if (kept.length > 1) return { lines: kept }
  return { splitMode: null, lines: [], categoryId: kept[0]?.categoryId ?? null }
}

function SplitLine({
  line,
  n,
  draft,
  categories,
  computed,
  accountCurrency,
  onChange,
}: {
  line: Line
  n: number
  draft: Draft
  categories: ReadonlyArray<Category>
  computed: bigint | null | undefined
  accountCurrency: string
  onChange: Update
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const set = (changes: Partial<Line>) =>
    onChange({
      lines: draft.lines.map((l) =>
        l.key === line.key ? { ...l, ...changes } : l,
      ),
    })
  return (
    <li className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <CategoryPicker
          label={t('transactions.category')}
          labelHidden
          categories={categories}
          kind={draft.kind}
          date={draft.occurredOn}
          value={line.categoryId}
          onChange={(categoryId) => set({ categoryId })}
        />
      </div>
      <div className="flex w-28 shrink-0 flex-col items-end gap-1">
        <input
          aria-label={t('transactions.lineValue', { n })}
          inputMode="decimal"
          autoComplete="off"
          value={line.value}
          onChange={(event) =>
            set({
              value:
                draft.splitMode === 'percent'
                  ? capPercent(
                      draft.lines,
                      { key: line.key, value: event.target.value },
                      locale,
                    )
                  : event.target.value,
            })
          }
          className={cn(fieldControl, 'text-right font-mono tabular-nums')}
        />
        {draft.splitMode !== 'amount' && computed != null && (
          <Money
            amount={fromMinor(computed, minorDigits(accountCurrency))}
            currency={accountCurrency}
            className="text-sm text-muted-foreground"
          />
        )}
      </div>
      <IconButton
        icon="close"
        label={t('transactions.removeLine')}
        onClick={() => onChange(withoutLine(draft.lines, line.key))}
      />
    </li>
  )
}

/**
 * TRX-06: lines in one mode. Montant lines are typed in the account's currency and must
 * leave nothing to share; shares and percentages show what each line comes to.
 */
export function SplitFields({
  draft,
  categories,
  total,
  accountCurrency,
  error,
  onChange,
}: {
  draft: Draft
  categories: ReadonlyArray<Category>
  total: bigint | null
  accountCurrency: string
  error: string | undefined
  onChange: Update
}) {
  const { t } = useTranslation()
  const panelId = useId()
  const mode = draft.splitMode ?? 'amount'
  const { amounts, remaining } = splitPreview(draft, total, accountCurrency)
  const nextKey = Math.max(0, ...draft.lines.map((l) => l.key)) + 1

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{t('transactions.splitBy')}</span>
      <TabList
        label={t('transactions.splitBy')}
        tabs={SPLIT_MODES}
        value={mode}
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
      <ul id={panelId} className="flex flex-col gap-2">
        {draft.lines.map((line, i) => (
          <SplitLine
            key={line.key}
            {...{ line, draft, categories, accountCurrency, onChange }}
            n={i + 1}
            computed={amounts[i]}
          />
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange({
            lines: [
              ...draft.lines,
              { key: nextKey, categoryId: null, value: '' },
            ],
          })
        }
      >
        <Icon name="plus" className="size-4" />
        {t('transactions.addLine')}
      </Button>
      {remaining !== null && mode !== 'share' && (
        <p className="flex justify-between text-sm">
          <span>{t('transactions.remaining')}</span>
          <Money
            amount={fromMinor(remaining, minorDigits(accountCurrency))}
            currency={accountCurrency}
            className="font-semibold"
          />
        </p>
      )}
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  )
}

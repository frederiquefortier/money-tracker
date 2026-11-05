import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyChip } from '#/components/currency-chip'
import { FieldMessage } from '#/components/form-field'
import { MissingRate, Money } from '#/components/money'
import { CategoryButton } from '#/components/transactions/category-field'
import {
  ReceiptLine,
  small,
  typed,
} from '#/components/transactions/receipt-line'
import { SplitLines } from '#/components/transactions/receipt-splits'
import { Checkbox } from '#/components/ui/checkbox'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Category } from '#/lib/categories'
import type { Currency } from '#/lib/currencies'
import { forInput } from '#/lib/transaction-draft'
import type { Draft } from '#/lib/transaction-draft'
import { bookedMinor, foreignPreview } from '#/lib/transaction-preview'
import { useLocale } from '#/lib/use-locale'
import { cn, focusRing } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** Which category the list is choosing: the transaction's, or a split line's (by key). */
export type PickTarget = 'main' | number

const rule = <hr className="my-1 border-dashed border-border" />

/**
 * CUR-08: what left the account, prefilled at the day's rate and editable, with the rate
 * close under it; then the fee against the market value.
 */
function ForeignLines({
  draft,
  accountCurrency,
  rate,
  error,
  onChange,
}: {
  draft: Draft
  accountCurrency: string
  rate: string | null | undefined
  error: string | undefined
  onChange: Update
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const id = useId()
  const format = FORMAT_LOCALE[locale]
  const preview = foreignPreview(draft, accountCurrency, rate ?? null)
  const paid = draft.paidByHand
    ? draft.paid
    : preview.prefill && forInput(preview.prefill, accountCurrency, locale)
  const percent = new Intl.NumberFormat(format, {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <ReceiptLine label={t('transactions.paid')} htmlFor={id}>
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={paid}
            aria-invalid={error ? true : undefined}
            onChange={(event) =>
              onChange({ paid: event.target.value, paidByHand: true })
            }
            className={cn(typed, 'w-24')}
          />
          {accountCurrency}
        </ReceiptLine>
        {rate && (
          <ReceiptLine label={t('transactions.rateLabel')} muted>
            {t('transactions.rate', {
              from: draft.currency,
              to: accountCurrency,
              rate: new Intl.NumberFormat(format, {
                maximumFractionDigits: 4,
              }).format(rate as Intl.StringNumericLiteral),
            })}
          </ReceiptLine>
        )}
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
      <ReceiptLine label={t('transactions.fee')}>
        {rate === null && <MissingRate />}
        {rate !== null && preview.fee !== null && (
          <>
            <Money amount={preview.fee} currency={accountCurrency} />
            {preview.feeRatio !== null &&
              ` (${percent.format(preview.feeRatio as Intl.StringNumericLiteral)})`}
          </>
        )}
      </ReceiptLine>
    </>
  )
}

/** The large amount, typed positive in the chip's currency (TRX-02). */
function AmountInput({
  value,
  invalid,
  autoFocus,
  onChange,
}: {
  value: string
  invalid: boolean
  autoFocus: boolean
  onChange: (amount: string) => void
}) {
  const { t } = useTranslation()
  return (
    <input
      aria-label={t('transactions.amount')}
      aria-invalid={invalid || undefined}
      inputMode="decimal"
      autoComplete="off"
      // The form opens on the amount, the first thing typed at the till.
      autoFocus={autoFocus}
      placeholder="0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(typed, 'w-0 flex-1 py-1 text-4xl font-semibold')}
    />
  )
}

/** Répartir itemizes the slip; in the same place, "Ne pas répartir" goes back. */
function SplitToggle({ draft, onChange }: { draft: Draft; onChange: Update }) {
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

type ReceiptProps = {
  draft: Draft
  categories: ReadonlyArray<Category>
  accountCurrency: string | null
  currencies: ReadonlyArray<Currency>
  rate: string | null | undefined
  errors: {
    amount?: string
    category?: string
    paid?: string
    splits?: string
  }
  autoFocus: boolean
  onChange: Update
  onPick: (target: PickTarget) => void
}

/**
 * Spec 15: the transaction as a receipt slip. The category's round icon, the amount and
 * the currency; Répartir, which itemizes the slip; Débité and Frais in another currency
 * than the account's; then En attente (TRX-09) after a rule.
 */
export function ReceiptAmount(props: ReceiptProps) {
  const { draft, categories, accountCurrency, errors, onChange, onPick } = props
  const { t } = useTranslation()
  const pendingId = useId()
  const foreign = accountCurrency !== null && draft.currency !== accountCurrency
  const single = draft.splitMode === null || accountCurrency === null
  return (
    <div className="receipt flex flex-col gap-3 bg-background px-4 pt-4 font-mono">
      <div className="flex items-center gap-3">
        {single && (
          <CategoryButton
            category={categories.find((c) => c.id === draft.categoryId)}
            categories={categories}
            kind={draft.kind}
            invalid={Boolean(errors.category)}
            className="size-12 [&_svg]:size-6"
            onOpen={() => onPick('main')}
          />
        )}
        <AmountInput
          value={draft.amount}
          invalid={Boolean(errors.amount)}
          autoFocus={props.autoFocus}
          onChange={(amount) => onChange({ amount })}
        />
        {draft.currency && (
          <CurrencyChip
            value={draft.currency}
            label={t('transactions.currency', { code: draft.currency })}
            currencies={props.currencies}
            onChange={(currency) =>
              onChange({ currency, paid: '', paidByHand: false })
            }
          />
        )}
      </div>
      {(errors.category ?? errors.amount) && (
        <FieldMessage>{errors.category ?? errors.amount}</FieldMessage>
      )}
      {(!single || draft.categoryId) && (
        <SplitToggle draft={draft} onChange={onChange} />
      )}
      {foreign && (
        <>
          {rule}
          <ForeignLines
            draft={draft}
            accountCurrency={accountCurrency}
            rate={props.rate}
            error={errors.paid}
            onChange={onChange}
          />
        </>
      )}
      {!single && (
        <>
          {rule}
          <SplitLines
            draft={draft}
            categories={categories}
            total={bookedMinor(draft, accountCurrency, props.rate ?? null)}
            accountCurrency={accountCurrency}
            error={errors.splits}
            onChange={onChange}
            onPick={onPick}
          />
        </>
      )}
      {rule}
      <ReceiptLine label={t('transactions.pending')} htmlFor={pendingId}>
        <Checkbox
          id={pendingId}
          checked={draft.pending}
          onChange={(event) => onChange({ pending: event.target.checked })}
        />
      </ReceiptLine>
    </div>
  )
}

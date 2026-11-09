import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyChip } from '#/components/display/currency-chip'
import { FieldMessage } from '#/components/forms/form-field'
import { MissingRate, Money } from '#/components/display/money'
import { CategoryButton } from '#/components/transactions/receipt/category-button'
import {
  ReceiptLine,
  slipRule,
  slipTyped,
} from '#/components/transactions/receipt/receipt-line'
import { PeopleLines } from '#/components/transactions/receipt/people-lines'
import { SplitLines } from '#/components/transactions/receipt/receipt-splits'
import { SplitToggle } from '#/components/transactions/receipt/split-toggle'
import { Checkbox } from '#/components/ui/checkbox'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Category } from '#/lib/categories/category'
import type { Currency } from '#/lib/currencies/currency'
import type { Person } from '#/lib/people/person'
import { absDecimal, amountForInput } from '#/lib/shared/money'
import {
  bookedMinor,
  foreignPreview,
} from '#/lib/transactions/transaction-preview'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'
import type { PickTarget } from '#/components/transactions/receipt/receipt-line'

type Update = (changes: Partial<TransactionDraft>) => void

/** Which category the list is choosing: the transaction's, or a split line's (by key). */

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
  draft: TransactionDraft
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
    : preview.prefill &&
      amountForInput(absDecimal(preview.prefill), accountCurrency, locale)
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
            className={cn(slipTyped, 'w-24')}
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
      <ReceiptLine label={t('transactions.conversionFee')}>
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
export function AmountInput({
  value,
  label,
  invalid,
  autoFocus,
  onChange,
}: {
  value: string
  /** The accessible name; Montant by default. */
  label?: string
  invalid: boolean
  autoFocus: boolean
  onChange: (amount: string) => void
}) {
  const { t } = useTranslation()
  return (
    <input
      aria-label={label ?? t('transactions.amount')}
      aria-invalid={invalid || undefined}
      inputMode="decimal"
      autoComplete="off"
      // The form opens on the amount, the first thing typed at the till.
      autoFocus={autoFocus}
      placeholder="0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(slipTyped, 'w-0 flex-1 py-1 text-4xl font-semibold')}
    />
  )
}

type ReceiptProps = {
  draft: TransactionDraft
  categories: ReadonlyArray<Category>
  accountCurrency: string | null
  currencies: ReadonlyArray<Currency>
  rate: string | null | undefined
  errors: {
    amount?: string
    category?: string
    paid?: string
    splits?: string
    people?: string
  }
  people: ReadonlyArray<Person>
  autoFocus: boolean
  onChange: Update
  onPick: (target: PickTarget) => void
  onOpenPeople: () => void
}

/** The category's round icon (unless split), the amount, and the currency chip. */
function AmountRow({
  single,
  draft,
  categories,
  errors,
  autoFocus,
  currencies,
  onChange,
  onPick,
}: ReceiptProps & { single: boolean }) {
  const { t } = useTranslation()
  return (
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
        autoFocus={autoFocus}
        onChange={(amount) => onChange({ amount })}
      />
      {draft.currency && (
        <CurrencyChip
          value={draft.currency}
          label={t('transactions.currency', { code: draft.currency })}
          currencies={currencies}
          onChange={(currency) =>
            onChange({ currency, paid: '', paidByHand: false })
          }
        />
      )}
    </div>
  )
}

/**
 * Spec 15: the transaction as a receipt slip. The category's round icon, the amount and
 * the currency; Répartir, which itemizes the slip; Débité and Frais in another currency
 * than the account's; the people's parts (spec 20); then En attente (TRX-09) after a rule.
 */
export function ReceiptAmount(props: ReceiptProps) {
  const { draft, categories, accountCurrency, errors, onChange, onPick } = props
  const { t } = useTranslation()
  const pendingId = useId()
  const foreign = accountCurrency !== null && draft.currency !== accountCurrency
  const single = draft.splitMode === null || accountCurrency === null
  return (
    <div className="receipt flex flex-col gap-3 bg-background px-4 pt-4 font-mono">
      <AmountRow {...props} single={single} />
      {(errors.category ?? errors.amount) && (
        <FieldMessage>{errors.category ?? errors.amount}</FieldMessage>
      )}
      {(!single || draft.categoryId) && (
        <SplitToggle draft={draft} onChange={onChange} />
      )}
      {foreign && (
        <>
          {slipRule}
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
          {slipRule}
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
      {accountCurrency !== null && draft.kind === 'expense' && (
        <PeopleLines
          draft={draft}
          people={props.people}
          total={bookedMinor(draft, accountCurrency, props.rate ?? null)}
          accountCurrency={accountCurrency}
          error={errors.people}
          onChange={onChange}
          onOpen={props.onOpenPeople}
        />
      )}
      {slipRule}
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

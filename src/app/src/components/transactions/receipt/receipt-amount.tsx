import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyChip } from '#/components/display/currency-chip'
import { FieldMessage } from '#/components/forms/form-field'
import { CategoryButton } from '#/components/transactions/receipt/category-button'
import { ForeignLines } from '#/components/transactions/receipt/receipt-foreign'
import {
  ReceiptLine,
  slipRule,
  slipTyped,
} from '#/components/transactions/receipt/receipt-line'
import { PeopleLines } from '#/components/transactions/receipt/people-lines'
import { SplitLines } from '#/components/transactions/receipt/receipt-splits'
import { SplitToggle } from '#/components/transactions/receipt/split-toggle'
import { Checkbox } from '#/components/ui/checkbox'
import type { Category } from '#/lib/categories/category'
import type { Currency } from '#/lib/currencies/currency'
import type { Person } from '#/lib/people/person'
import { bookedMinor } from '#/lib/transactions/transaction-preview'
import { cn } from '#/lib/utils'
import type {
  DraftUpdate,
  TransactionDraft,
} from '#/lib/transactions/transaction-draft-types'
import type { PickTarget } from '#/components/transactions/receipt/receipt-line'

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
      className={cn(
        slipTyped,
        'w-0 flex-1 py-1 text-4xl font-semibold md:text-4xl',
      )}
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
  onChange: DraftUpdate
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
 * the transaction as a receipt slip. The category's round icon, the amount and
 * the currency; Répartir, which itemizes the slip; Débité and Frais in another currency
 * than the account's; the people's parts; then En attente (TRX-09) after a rule.
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

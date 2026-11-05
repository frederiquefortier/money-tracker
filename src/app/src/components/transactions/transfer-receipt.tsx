import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FixedCurrency } from '#/components/currency-chip'
import { FieldMessage } from '#/components/form-field'
import { Icon } from '#/components/icon'
import { MissingRate, Money } from '#/components/money'
import { AmountInput, rule } from '#/components/transactions/receipt-amount'
import { ReceiptLine, typed } from '#/components/transactions/receipt-line'
import { Checkbox } from '#/components/ui/checkbox'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { amountForInput } from '#/lib/money'
import { transferPreview } from '#/lib/transfer-draft'
import type { TransferDraft } from '#/lib/transfer-draft'
import { useLocale } from '#/lib/use-locale'
import { cn } from '#/lib/utils'

type Update = (changes: Partial<TransferDraft>) => void

/**
 * TRX-11: what arrived, prefilled at the day's rate and editable, the rate close under
 * it, then the conversion cost in the departure currency.
 */
function ReceivedLines({
  draft,
  currencies,
  rate,
  error,
  onChange,
}: {
  draft: TransferDraft
  currencies: { from: string; to: string }
  rate: string | null | undefined
  error: string | undefined
  onChange: Update
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const id = useId()
  const preview = transferPreview(draft, currencies, rate ?? null)
  const received = draft.receivedByHand
    ? draft.received
    : preview.prefill && amountForInput(preview.prefill, currencies.to, locale)
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <ReceiptLine label={t('transactions.transfer.received')} htmlFor={id}>
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={received}
            aria-invalid={error ? true : undefined}
            onChange={(event) =>
              onChange({ received: event.target.value, receivedByHand: true })
            }
            className={cn(typed, 'w-24')}
          />
          {currencies.to}
          {preview.value !== null && (
            <span className="text-muted-foreground">
              ≈ <Money amount={preview.value} currency={currencies.from} />
            </span>
          )}
        </ReceiptLine>
        {rate && (
          <ReceiptLine label={t('transactions.rateLabel')} muted>
            {t('transactions.rate', {
              from: currencies.from,
              to: currencies.to,
              rate: new Intl.NumberFormat(FORMAT_LOCALE[locale], {
                maximumFractionDigits: 4,
              }).format(rate as Intl.StringNumericLiteral),
            })}
          </ReceiptLine>
        )}
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
      <ReceiptLine label={t('transactions.conversionFee')}>
        {rate === null && <MissingRate />}
        {rate !== null && preview.cost !== null && (
          <Money amount={preview.cost} currency={currencies.from} />
        )}
      </ReceiptLine>
    </>
  )
}

/**
 * TRX-04: the fee in the departure currency. It goes to the category set in Réglages;
 * without one, the error under it leads there.
 */
function FeeLine({
  draft,
  currency,
  error,
  unset,
  onChange,
}: {
  draft: TransferDraft
  currency: string | null
  error: string | undefined
  unset: boolean
  onChange: Update
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <>
      <ReceiptLine label={t('transactions.transactionFee')} htmlFor={id}>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={draft.fee}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange({ fee: event.target.value })}
          className={cn(typed, 'w-24')}
        />
        {currency}
      </ReceiptLine>
      {error && (
        <FieldMessage>
          {error}{' '}
          {unset && (
            <>
              <Link
                to="/settings/categories"
                className="font-semibold underline"
              >
                {t('settings.categories')}
              </Link>
              .
            </>
          )}
        </FieldMessage>
      )}
    </>
  )
}

type ReceiptProps = {
  draft: TransferDraft
  currencies: { from: string | null; to: string | null }
  rate: string | null | undefined
  feeCategorySet: boolean
  errors: {
    amount?: string
    received?: string
    fee?: string
  }
  autoFocus: boolean
  onChange: Update
}

/**
 * Spec 16, on the slip of spec 15: the amount that left, in the departure account's
 * currency; what arrived and its cost between two currencies; the fee; then each side's
 * En attente (TRX-09) after a rule.
 */
export function TransferReceipt(props: ReceiptProps) {
  const { draft, currencies, errors, onChange } = props
  const { t } = useTranslation()
  const fromPendingId = useId()
  const toPendingId = useId()
  const { from, to } = currencies
  return (
    <div className="receipt flex flex-col gap-3 bg-background px-4 pt-4 font-mono">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-6"
        >
          <Icon name="arrow-left-right" />
        </span>
        <AmountInput
          value={draft.amount}
          invalid={Boolean(errors.amount)}
          autoFocus={props.autoFocus}
          onChange={(amount) => onChange({ amount })}
        />
        {from && <FixedCurrency value={from} />}
      </div>
      {errors.amount && <FieldMessage>{errors.amount}</FieldMessage>}
      {from && to && from !== to && (
        <>
          {rule}
          <ReceivedLines
            draft={draft}
            currencies={{ from, to }}
            rate={props.rate}
            error={errors.received}
            onChange={onChange}
          />
        </>
      )}
      {rule}
      <FeeLine
        draft={draft}
        currency={from}
        error={errors.fee}
        unset={!props.feeCategorySet}
        onChange={onChange}
      />
      {rule}
      <ReceiptLine
        label={t('transactions.transfer.fromPending')}
        htmlFor={fromPendingId}
      >
        <Checkbox
          id={fromPendingId}
          checked={draft.fromPending}
          onChange={(event) => onChange({ fromPending: event.target.checked })}
        />
      </ReceiptLine>
      <ReceiptLine
        label={t('transactions.transfer.toPending')}
        htmlFor={toPendingId}
      >
        <Checkbox
          id={toPendingId}
          checked={draft.toPending}
          onChange={(event) => onChange({ toPending: event.target.checked })}
        />
      </ReceiptLine>
    </div>
  )
}

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyChip } from '#/components/currency-chip'
import { FieldMessage, FormField } from '#/components/form-field'
import { LinkedFields } from '#/components/linked-fields'
import { MissingRate, Money } from '#/components/money'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { UserCurrency } from '#/lib/currencies'
import { formatDate } from '#/lib/format'
import type { Draft } from '#/lib/transaction-draft'
import { forInput } from '#/lib/transaction-draft'
import { foreignPreview } from '#/lib/transaction-preview'
import { useLocale } from '#/lib/use-locale'
import { cn, focusRing } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/** The amount, large, typed positive in the chip's currency (TRX-02). */
export function AmountField({
  draft,
  currencies,
  error,
  autoFocus,
  onChange,
}: {
  draft: Draft
  currencies: ReadonlyArray<UserCurrency>
  error: string | undefined
  autoFocus: boolean
  onChange: Update
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <input
          id={id}
          aria-label={t('transactions.amount')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          inputMode="decimal"
          autoComplete="off"
          // The sheet opens on the amount, the first thing typed at the till.
          autoFocus={autoFocus}
          placeholder="0"
          value={draft.amount}
          onChange={(event) => onChange({ amount: event.target.value })}
          className={cn(
            'w-48 min-w-0 rounded-field border-b-2 border-input bg-transparent px-2 py-1 text-right font-mono text-4xl font-semibold tabular-nums aria-invalid:border-destructive',
            focusRing,
          )}
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
      {error && <FieldMessage id={`${id}-error`}>{error}</FieldMessage>}
    </div>
  )
}

function RateLine({
  from,
  to,
  rate,
  date,
}: {
  from: string
  to: string
  rate: string
  date: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const shown = new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    maximumFractionDigits: 4,
  }).format(rate as Intl.StringNumericLiteral)
  return (
    <p className="text-sm text-muted-foreground">
      {t('transactions.rate', {
        from,
        to,
        rate: shown,
        date: formatDate(date, locale, 'medium'),
      })}
    </p>
  )
}

/**
 * CUR-08: in another currency than the account's, what was paid in the account's currency,
 * prefilled at that day's rate and editable, and the fee against the market rate.
 */
export function ForeignFields({
  draft,
  accountCurrency,
  rate,
  error,
  onChange,
}: {
  draft: Draft
  accountCurrency: string
  /** undefined while it loads, null when missing. */
  rate: string | null | undefined
  error: string | undefined
  onChange: Update
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const preview = foreignPreview(draft, accountCurrency, rate ?? null)
  const percent = new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  const paid = draft.paidByHand
    ? draft.paid
    : preview.prefill && forInput(preview.prefill, accountCurrency, locale)

  return (
    <LinkedFields>
      <FormField
        name="paid"
        label={t('transactions.paid')}
        inputMode="decimal"
        autoComplete="off"
        value={paid}
        error={error}
        onChange={(event) =>
          onChange({ paid: event.target.value, paidByHand: true })
        }
      />
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">{t('transactions.fee')}</span>
        {rate === null ? (
          <MissingRate />
        ) : (
          preview.fee !== null && (
            <span>
              <Money amount={preview.fee} currency={accountCurrency} />
              {preview.feeRatio !== null &&
                ` (${percent.format(preview.feeRatio as Intl.StringNumericLiteral)})`}
            </span>
          )
        )}
        {rate && (
          <RateLine
            from={draft.currency}
            to={accountCurrency}
            rate={rate}
            date={draft.occurredOn}
          />
        )}
      </div>
    </LinkedFields>
  )
}

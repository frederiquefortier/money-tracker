import { CurrencyCode } from '#/components/display/currency-code'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldMessage } from '#/components/forms/form-field'
import { Skeleton } from '#/components/feedback/skeleton'
import { MissingRate, Money } from '#/components/display/money'
import {
  ReceiptLine,
  slipTyped,
} from '#/components/transactions/receipt/receipt-line'
import { absDecimal, amountForInput } from '#/lib/shared/money'
import { foreignPreview } from '#/lib/transactions/transaction-preview'
import { percentFormat, formatRate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import type {
  DraftUpdate,
  TransactionDraft,
} from '#/lib/transactions/transaction-draft-types'

/**
 * CUR-08: what left the account, prefilled at the day's rate and editable, with the rate
 * close under it; then the fee against the market value.
 */
export function ForeignLines({
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
  onChange: DraftUpdate
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const id = useId()
  const preview = foreignPreview(draft, accountCurrency, rate ?? null)
  const paid = draft.paidByHand
    ? draft.paid
    : preview.prefill &&
      amountForInput(absDecimal(preview.prefill), accountCurrency, locale)
  const percent = percentFormat(locale, 1)
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
          <CurrencyCode code={accountCurrency} />
        </ReceiptLine>
        {rate === undefined && (
          <ReceiptLine label={t('transactions.rateLabel')} muted>
            <Skeleton label={t('common.loading')} className="w-28" />
          </ReceiptLine>
        )}
        {rate && (
          <ReceiptLine label={t('transactions.rateLabel')} muted>
            {t('transactions.rate', {
              from: draft.currency,
              to: accountCurrency,
              rate: formatRate(rate, locale),
            })}
          </ReceiptLine>
        )}
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
      <ReceiptLine label={t('transactions.conversionFee')}>
        {rate === undefined && <Skeleton className="w-16" />}
        {rate === null && <MissingRate />}
        {rate && preview.fee !== null && (
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

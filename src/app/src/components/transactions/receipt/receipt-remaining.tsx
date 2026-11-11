import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { slipSmall } from '#/components/transactions/receipt/receipt-line'
import { formatMoney, percentFormat } from '#/lib/shared/format'
import { fromMinor, minorDigits } from '#/lib/shared/money'
import type { SplitMode } from '#/lib/transactions/transaction'
import { percentLeft } from '#/lib/transactions/transaction-preview'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

/**
 * What is left to share, one quiet line under the split lines: a check once everything
 * is shared, a warning while something is left or the lines go over. `format` writes the
 * gap, in money or in percent.
 */
function RemainingLine({
  remaining,
  format,
}: {
  remaining: bigint
  format: (gap: bigint) => string
}) {
  const { t } = useTranslation()
  const done = remaining === 0n
  const over = remaining < 0n
  return (
    <p
      className={cn(
        'flex items-center justify-end gap-1.5 text-muted-foreground',
        slipSmall,
      )}
    >
      <Icon
        name={done ? 'circle-check' : 'circle-warning'}
        className="size-4"
      />
      {done
        ? t('transactions.allSplit')
        : t(over ? 'transactions.overSplit' : 'transactions.remaining', {
            amount: format(over ? -remaining : remaining),
          })}
    </p>
  )
}

/**
 * What is left of the splits or the people's parts: in percent in % mode (from the typed
 * `values`), in the account's currency otherwise.
 */
export function SplitRemaining({
  mode,
  values,
  remaining,
  accountCurrency,
}: {
  mode: SplitMode
  values: ReadonlyArray<string>
  remaining: bigint | null
  accountCurrency: string
}) {
  const locale = useLocale()
  const percent = percentFormat(locale, 2)
  const inPercent = mode === 'percent'
  return (
    <RemainingLine
      remaining={inPercent ? percentLeft(values) : (remaining ?? 0n)}
      format={(gap) =>
        inPercent
          ? percent.format(fromMinor(gap, 6) as Intl.StringNumericLiteral)
          : formatMoney(
              fromMinor(gap, minorDigits(accountCurrency)),
              accountCurrency,
              locale,
            )
      }
    />
  )
}

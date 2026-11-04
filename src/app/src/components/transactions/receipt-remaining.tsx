import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { small } from '#/components/transactions/receipt-line'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { formatMoney } from '#/lib/format'
import { fromMinor, minorDigits } from '#/lib/money'
import type { Draft } from '#/lib/transaction-draft'
import { percentLeft } from '#/lib/transaction-preview'
import { useLocale } from '#/lib/use-locale'
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
        small,
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

/** What is left: in percent in % mode, in the account's currency otherwise. */
export function SplitRemaining({
  draft,
  remaining,
  accountCurrency,
}: {
  draft: Draft
  remaining: bigint | null
  accountCurrency: string
}) {
  const locale = useLocale()
  const percent = new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    style: 'percent',
    maximumFractionDigits: 2,
  })
  const inPercent = draft.splitMode === 'percent'
  return (
    <RemainingLine
      remaining={
        inPercent
          ? percentLeft(draft.lines.map((l) => l.value))
          : (remaining ?? 0n)
      }
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

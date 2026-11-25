import { useTranslation } from 'react-i18next'
import { ThinGap } from '#/components/display/thin-gap'
import { Icon } from '#/components/display/icon'
import { hiddenMoneyParts, moneyFormat } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { usePrivacy } from '#/hooks/app/use-privacy'
import { cn } from '#/lib/utils'

/**
 * An amount in its currency. `signed` shows the plus of an income. `converted` marks a
 * total that mixes currencies with ≈ (CUR-09); a converted row shows its original amount
 * instead. `detail` is the hover text and the screen readers' name. `whole` drops the cents.
 * In privacy mode (SET-08) the digits never reach the page, nor does `detail`.
 */
export function Money({
  amount,
  currency,
  signed = false,
  converted = false,
  whole = false,
  detail,
  className,
}: {
  amount: string
  currency: string
  signed?: boolean
  converted?: boolean
  whole?: boolean
  detail?: string
  className?: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const format = moneyFormat(currency, locale, {
    signDisplay: signed ? 'exceptZero' : 'auto',
    whole,
  })
  const { figuresHidden } = usePrivacy()
  const shown = format.formatToParts(amount as Intl.StringNumericLiteral)
  const parts = figuresHidden ? hiddenMoneyParts(currency, locale) : shown
  const text = parts.map((part) => part.value).join('')
  const label = figuresHidden
    ? t('privacy.hiddenAmount', { currency })
    : (detail ??
      (converted ? t('money.converted', { amount: text, currency }) : text))

  return (
    <span
      className={cn('font-mono whitespace-nowrap tabular-nums', className)}
      title={
        figuresHidden ? undefined : (detail ?? (converted ? label : undefined))
      }
      aria-label={label}
    >
      <span aria-hidden="true">
        {converted && <span className="text-muted-foreground">≈ </span>}
        {parts.map((part, i) => {
          // French puts a full space before the symbol; a thin gap replaces it.
          if (part.type === 'literal' && parts[i + 1]?.type === 'currency')
            return <ThinGap key={i} />
          if (part.type === 'decimal' || part.type === 'fraction')
            return (
              <span key={i} className="text-[0.75em]">
                {part.value}
              </span>
            )
          return part.value
        })}
      </span>
    </span>
  )
}

/** A converted total with a missing rate: an error, never a partial sum (ADR-004). */
export function MissingRate() {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-destructive"
      title={t('money.missingRate')}
    >
      <Icon name="circle-warning" className="size-4" />
      {t('money.missingRateShort')}
    </span>
  )
}

import { useTranslation } from 'react-i18next'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { cn } from '#/lib/utils'

/**
 * An amount in its currency, cents set smaller (layout reference). `converted` adds the
 * ≈ marker of CUR-09; the full marker with the rate details comes with spec 14.
 */
export function Money({
  amount,
  currency,
  locale,
  converted = false,
  className,
}: {
  amount: string
  currency: string
  locale: Locale
  converted?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const parts = new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    style: 'currency',
    currency,
  }).formatToParts(amount as Intl.StringNumericLiteral)
  const text = parts.map((p) => p.value).join('')

  return (
    <span
      className={cn('whitespace-nowrap tabular-nums', className)}
      aria-label={
        converted ? t('money.converted', { amount: text, currency }) : text
      }
    >
      <span aria-hidden="true">
        {converted && <span className="text-muted-foreground">≈ </span>}
        {parts.map((part, i) =>
          part.type === 'fraction' ? (
            <span key={i} className="text-[0.8em]">
              {part.value}
            </span>
          ) : (
            part.value
          ),
        )}
      </span>
    </span>
  )
}

/** A converted total with a missing rate: an error, never a partial sum (ADR-004). */
export function MissingRate() {
  const { t } = useTranslation()
  return (
    <span className="text-sm text-destructive" title={t('money.missingRate')}>
      {t('money.missingRateShort')}
    </span>
  )
}

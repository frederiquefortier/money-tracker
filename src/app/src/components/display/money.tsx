import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { moneyFormat } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

/**
 * An amount in its currency. `signed` shows the plus of an income. `converted` marks a
 * total that mixes currencies with ≈ (CUR-09); a converted row shows its original amount
 * instead. `detail` is the hover text and the screen readers' name.
 */
export function Money({
  amount,
  currency,
  signed = false,
  converted = false,
  detail,
  className,
}: {
  amount: string
  currency: string
  signed?: boolean
  converted?: boolean
  detail?: string
  className?: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const text = moneyFormat(
    currency,
    locale,
    signed ? 'exceptZero' : 'auto',
  ).format(amount as Intl.StringNumericLiteral)
  const label =
    detail ??
    (converted ? t('money.converted', { amount: text, currency }) : text)

  return (
    <span
      className={cn('whitespace-nowrap tabular-nums', className)}
      title={detail ?? (converted ? label : undefined)}
      aria-label={label}
    >
      <span aria-hidden="true">
        {converted && <span className="text-muted-foreground">≈ </span>}
        {text}
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

import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import type { Locale } from '#/i18n/locales'
import { RATES_HISTORY_START, currencyName } from '#/lib/currencies'
import type { Currency, UserCurrency } from '#/lib/currencies'
import { formatDate } from '#/lib/format'
import { cn, focusRing } from '#/lib/utils'

/** Code, name and tag, then the symbol beside the actions. */
function CurrencyLabel({
  currency,
  locale,
  isDefault = false,
}: {
  currency: Currency
  locale: Locale
  isDefault?: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      <span className="w-9 shrink-0 font-mono font-bold">{currency.code}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{currencyName(currency, locale)}</span>
        {isDefault && (
          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold text-primary">
            {t('currencies.defaultBadge')}
          </span>
        )}
      </span>
      <span className="max-w-12 shrink-0 truncate text-right font-mono font-bold">
        {currency.symbol}
      </span>
    </>
  )
}

function RatesNote({
  ratesFrom,
  locale,
}: {
  ratesFrom: string | null | undefined
  locale: Locale
}) {
  const { t } = useTranslation()
  // undefined: EUR, or a currency not loaded yet. Older history needs no note.
  if (
    ratesFrom === undefined ||
    (ratesFrom && ratesFrom <= RATES_HISTORY_START)
  )
    return null
  return (
    <span className="block pl-12 text-xs text-muted-foreground">
      {ratesFrom
        ? t('currencies.ratesFrom', { date: formatDate(ratesFrom, locale) })
        : t('currencies.ratesPending')}
    </span>
  )
}

/** `muted` looks disabled but still answers a tap, so the reason can be shown. */
function RowAction({
  icon,
  label,
  pressed,
  muted = false,
  onClick,
}: {
  icon: IconName
  label: string
  pressed?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={muted || undefined}
      onClick={onClick}
      className={cn(
        'rounded-lg p-1.5',
        muted
          ? 'cursor-default text-muted-foreground/50'
          : 'text-primary hover:bg-secondary',
        focusRing,
      )}
    >
      <Icon name={icon} />
    </button>
  )
}

export function CurrencyRow({
  currency,
  isDefault,
  ratesFrom,
  locale,
  onFavourite,
  onMakeDefault,
  onRemove,
}: {
  currency: UserCurrency
  isDefault: boolean
  ratesFrom: string | null | undefined
  locale: Locale
  onFavourite: (on: boolean) => void
  onMakeDefault: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { code } = currency
  return (
    <li className="py-2.5 pr-2 pl-4">
      <div className="flex items-center gap-3">
        <CurrencyLabel
          currency={currency}
          locale={locale}
          isDefault={isDefault}
        />
        <div className="flex shrink-0 items-center">
          <RowAction
            icon={currency.isFavourite ? 'star-fill' : 'star'}
            label={t('currencies.favourite', { code })}
            pressed={currency.isFavourite}
            onClick={() => onFavourite(!currency.isFavourite)}
          />
          <RowAction
            icon="house-check"
            label={
              isDefault
                ? t('currencies.isDefault', { code })
                : t('currencies.makeDefaultFor', { code })
            }
            muted={isDefault}
            onClick={isDefault ? undefined : onMakeDefault}
          />
          <RowAction
            icon="trash"
            label={
              isDefault
                ? t('currencies.defaultCannotBeRemoved')
                : t('currencies.removeCode', { code })
            }
            muted={isDefault}
            onClick={onRemove}
          />
        </div>
      </div>
      <RatesNote ratesFrom={ratesFrom} locale={locale} />
    </li>
  )
}

/** A currency being checked with HexaRate: shown in place, nothing else blocked. */
export function PendingCurrencyRow({
  currency,
  locale,
}: {
  currency: Currency
  locale: Locale
}) {
  const { t } = useTranslation()
  return (
    <li
      className="flex items-center gap-3 py-2.5 pr-3.5 pl-4 text-muted-foreground"
      aria-live="polite"
    >
      <CurrencyLabel currency={currency} locale={locale} />
      <Icon
        name="loading"
        label={t('currencies.adding', { code: currency.code })}
        className="size-5 animate-spin"
      />
    </li>
  )
}

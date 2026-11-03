import { useTranslation } from 'react-i18next'
import { IconActions, IconButton } from '#/components/icon-button'
import type { Locale } from '#/i18n/locales'
import { RATES_HISTORY_START, currencyName } from '#/lib/currencies'
import type { Currency, UserCurrency } from '#/lib/currencies'
import { formatDate } from '#/lib/format'

/** Code, then the name with its symbol in parentheses, then the tag. */
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
        <span className="flex min-w-0 gap-1">
          <span className="truncate">{currencyName(currency, locale)}</span>
          <span className="shrink-0">({currency.symbol})</span>
        </span>
        {isDefault && (
          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold text-primary">
            {t('currencies.defaultBadge')}
          </span>
        )}
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

export function CurrencyRow({
  currency,
  isDefault,
  removeHint,
  ratesFrom,
  locale,
  onFavourite,
  onMakeDefault,
  onRemove,
}: {
  currency: UserCurrency
  isDefault: boolean
  removeHint: string | null
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
        <IconActions slots={3}>
          <IconButton
            icon={currency.isFavourite ? 'star-fill' : 'star'}
            label={t('currencies.favourite', { code })}
            pressed={currency.isFavourite}
            onClick={() => onFavourite(!currency.isFavourite)}
          />
          <IconButton
            icon="house-check"
            label={
              isDefault
                ? t('currencies.isDefault', { code })
                : t('currencies.makeDefaultFor', { code })
            }
            muted={isDefault}
            onClick={isDefault ? undefined : onMakeDefault}
          />
          <IconButton
            icon="trash"
            label={removeHint ?? t('currencies.removeCode', { code })}
            muted={removeHint !== null}
            onClick={onRemove}
          />
        </IconActions>
      </div>
      <RatesNote ratesFrom={ratesFrom} locale={locale} />
    </li>
  )
}

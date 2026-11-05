import { useTranslation } from 'react-i18next'
import { IconActions, IconButton } from '#/components/icon-button'
import { Tag } from '#/components/tag'
import { RATES_HISTORY_START, currencyName } from '#/lib/currencies'
import type { Currency } from '#/lib/currencies'
import { formatDate } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'

/** Code, then the name with its symbol in parentheses, then the tag. */
function CurrencyLabel({
  currency,
  isDefault = false,
}: {
  currency: Currency
  isDefault?: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <span className="w-9 shrink-0 font-mono font-bold">{currency.code}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex min-w-0 gap-1">
          <span className="truncate">{currencyName(currency, locale)}</span>
          <span className="shrink-0">({currency.symbol})</span>
        </span>
        {isDefault && <Tag>{t('currencies.defaultBadge')}</Tag>}
      </span>
    </>
  )
}

function RatesNote({ ratesFrom }: { ratesFrom: string | null | undefined }) {
  const { t } = useTranslation()
  const locale = useLocale()
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
  onMakeDefault,
  onRemove,
}: {
  currency: Currency
  isDefault: boolean
  removeHint: string | null
  ratesFrom: string | null | undefined
  onMakeDefault: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { code } = currency
  return (
    <li className="py-2.5 pr-2 pl-4">
      <div className="flex items-center gap-3">
        <CurrencyLabel currency={currency} isDefault={isDefault} />
        <IconActions slots={2} placement="always">
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
            icon="trash-full"
            label={removeHint ?? t('currencies.removeCode', { code })}
            muted={removeHint !== null}
            onClick={onRemove}
          />
        </IconActions>
      </div>
      <RatesNote ratesFrom={ratesFrom} />
    </li>
  )
}

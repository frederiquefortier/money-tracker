import { CurrencyCode } from '#/components/display/currency-code'
import { useTranslation } from 'react-i18next'
import { IconActions, IconButton } from '#/components/display/icon-button'
import { Tag } from '#/components/display/tag'
import { FormAlert } from '#/components/forms/form-field'
import { RATES_HISTORY_START, currencyName } from '#/lib/currencies/currency'
import type { Currency } from '#/lib/currencies/currency'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'

/** Code, then the name with its symbol in parentheses, then the tags, wrapping on a phone. */
function CurrencyLabel({
  currency,
  isDefault = false,
  ratesPending = false,
}: {
  currency: Currency
  isDefault?: boolean
  ratesPending?: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <CurrencyCode code={currency.code} className="w-9 shrink-0 font-bold" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex min-w-0 gap-1">
          <span className="truncate">{currencyName(currency, locale)}</span>
          <span className="shrink-0">({currency.symbol})</span>
        </span>
        {isDefault && <Tag>{t('currencies.defaultBadge')}</Tag>}
        {ratesPending && (
          <FormAlert tone="warning" size="tag" className="w-fit max-w-full">
            {t('currencies.ratesPending')}
          </FormAlert>
        )}
      </div>
    </>
  )
}

function RatesNote({ ratesFrom }: { ratesFrom: string | null | undefined }) {
  const { t } = useTranslation()
  const locale = useLocale()
  // undefined: EUR, or a currency not loaded yet. null: none yet, the tag says so. Older
  // history needs no note.
  if (!ratesFrom || ratesFrom <= RATES_HISTORY_START) return null
  return (
    <span className="block pl-12 text-xs text-muted-foreground">
      {t('currencies.ratesFrom', { date: formatDate(ratesFrom, locale) })}
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
        <CurrencyLabel
          currency={currency}
          isDefault={isDefault}
          ratesPending={ratesFrom === null}
        />
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

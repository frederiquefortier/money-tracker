import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { holdingLabel, isOpenOn } from '#/lib/holdings/holding'
import { useLocale } from '#/hooks/app/use-locale'
import type { FormHolding } from '#/lib/holdings/holding'

/**
 * NW-03: the holding an investment transaction pays into or out of. It offers the holdings
 * open on the transaction's date, and the one already chosen whatever its dates.
 */
export function HoldingPicker({
  holdings,
  value,
  date,
  hideLabel = false,
  onChange,
}: {
  holdings: ReadonlyArray<FormHolding>
  value: string | null
  date: string
  hideLabel?: boolean
  onChange: (holdingId: string | null) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const options = holdings
    .filter((h) => h.id === value || isOpenOn(h, date))
    .map((h) => ({ value: h.id, label: holdingLabel(h, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label, FORMAT_LOCALE[locale]))
  return (
    <Combobox
      label={t('holdings.field')}
      hideLabel={hideLabel}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('holdings.clearField')}
    />
  )
}

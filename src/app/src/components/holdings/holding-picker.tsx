import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { isOpenOn } from '#/lib/holdings/holding'
import type { FormHolding } from '#/lib/holdings/holding'

/**
 * NW-03: the holding an investment transaction pays into or out of. It offers the holdings
 * open on the transaction's date, and the one already chosen whatever its dates.
 */
export function HoldingPicker({
  holdings,
  value,
  date,
  onChange,
}: {
  holdings: ReadonlyArray<FormHolding>
  value: string | null
  date: string
  onChange: (holdingId: string | null) => void
}) {
  const { t } = useTranslation()
  const options = holdings
    .filter((h) => h.id === value || isOpenOn(h, date))
    .map((h) => ({ value: h.id, label: h.name }))
  return (
    <Combobox
      label={t('holdings.field')}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('holdings.clearField')}
    />
  )
}

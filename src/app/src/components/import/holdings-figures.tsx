import { useTranslation } from 'react-i18next'
import { BigNumber, Tile } from '#/components/import/figure-cards'
import { FormAlert } from '#/components/forms/form-field'
import { useLocale } from '#/hooks/app/use-locale'
import { formatDate } from '#/lib/shared/format'
import { holdingsRange } from '#/lib/import/import-summary'
import type { ImportCheck, ImportInput } from '#/lib/import/import'

type Checked = Extract<ImportCheck, { ok: true }>

/** What the holdings files bring, in the same cards as the transactions. */
export function HoldingsFigures({
  check,
  input,
}: {
  check: Checked
  input: ImportInput
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { counts } = check
  const range = holdingsRange(input)
  const tiles = [
    {
      value: counts.holdings + counts.holdingsMatched,
      label: t('import.tiles.holdingsCount'),
    },
    {
      value: input.contributions.length,
      label: t('import.tiles.contributions'),
    },
    {
      value: input.holding_transfers.length,
      label: t('import.tiles.holdingTransfers'),
    },
  ].filter((tile) => tile.value > 0)
  const values = input.snapshots.length
  if (values + tiles.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t('import.tiles.holdings')}</h2>
        {counts.holdingRowsSkipped > 0 && (
          <FormAlert tone="warning" size="tag">
            {t('import.skipped', { count: counts.holdingRowsSkipped })}
          </FormAlert>
        )}
      </div>
      {values > 0 && (
        <BigNumber value={values} label={t('import.tiles.snapshots')} />
      )}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-flow-col sm:auto-cols-fr">
          {tiles.map((tile) => (
            <Tile key={tile.label} value={tile.value} label={tile.label} />
          ))}
        </div>
      )}
      <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
        {range.from && range.to && (
          <p>
            {t('import.range', {
              from: formatDate(range.from, locale, 'medium'),
              to: formatDate(range.to, locale, 'medium'),
            })}
          </p>
        )}
      </div>
    </div>
  )
}

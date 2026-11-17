import { useTranslation } from 'react-i18next'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { RANGE_PRESETS, parseRange } from '#/lib/net-worth/net-worth-range'
import type { SeriesRange } from '#/lib/net-worth/net-worth-range'

/** The hub's one period: what the charts draw and every change is over (NW-04). */
export function RangeTabs({
  range,
  onChange,
}: {
  range: SeriesRange
  onChange: (range: SeriesRange) => void
}) {
  const { t } = useTranslation()
  const names = (preset: SeriesRange) => {
    if (preset === 'all') return { short: t('netWorth.chart.all') }
    const count = Number(preset.slice(1))
    return preset.startsWith('y')
      ? {
          short: t('netWorth.chart.yearsShort', { count }),
          full: t('netWorth.chart.years', { count }),
        }
      : {
          short: t('netWorth.chart.monthsShort', { count }),
          full: t('netWorth.chart.months', { count }),
        }
  }
  return (
    <ToggleGroup
      type="single"
      value={range}
      onValueChange={(next) => {
        const preset = parseRange(next)
        if (preset) onChange(preset)
      }}
      aria-label={t('netWorth.chart.range')}
      className="w-full gap-0.5 sm:w-fit"
    >
      {RANGE_PRESETS.map((preset) => {
        const { short, full } = names(preset)
        return (
          <ToggleGroupItem
            key={preset}
            value={preset}
            aria-label={full}
            className="flex-1 px-1 sm:px-2.5"
          >
            {short}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

import { useTranslation } from 'react-i18next'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { IconButton } from '#/components/display/icon-button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { DASHBOARD_PERIODS } from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { oneOf } from '#/lib/shared/collections'

const parseUnit = oneOf(DASHBOARD_PERIODS)

/**
 * DSH-01, DSH-08: a calendar year, the current one by default, or everything. The year
 * steps back and forth by one, its menu jumps further.
 */
export function PeriodControls({
  period,
  firstYear,
  today,
  onChange,
}: {
  period: DashboardPeriod
  firstYear: number
  today: string
  onChange: (period: DashboardPeriod) => void
}) {
  const { t } = useTranslation()
  const lastYear = Number(today.slice(0, 4))
  const first = Math.min(firstYear, lastYear)
  const years = Array.from({ length: lastYear - first + 1 }, (_, i) =>
    String(lastYear - i),
  )
  const year = Number(period.year)
  const step = (by: number) => onChange({ ...period, year: String(year + by) })
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        value={period.unit}
        onValueChange={(next) => {
          const unit = parseUnit(next)
          if (unit) onChange({ ...period, unit })
        }}
        aria-label={t('dashboard.period.unitLabel')}
        className="gap-0.5"
      >
        {DASHBOARD_PERIODS.map((unit) => (
          <ToggleGroupItem key={unit} value={unit} className="px-2.5">
            {t(`dashboard.period.units.${unit}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {period.unit === 'year' && (
        <div className="flex items-center">
          <IconButton
            icon="chevron-left"
            label={t('dashboard.period.previous')}
            disabled={year <= first}
            onClick={() => step(-1)}
          />
          <ChoiceMenu
            label={t('dashboard.period.yearLabel', { year: period.year })}
            value={period.year}
            options={
              years.includes(period.year) ? years : [period.year, ...years]
            }
            labelOf={(value) => value}
            onChange={(next) => onChange({ ...period, year: next })}
          />
          <IconButton
            icon="chevron-right"
            label={t('dashboard.period.next')}
            disabled={year >= lastYear}
            onClick={() => step(1)}
          />
        </div>
      )}
    </div>
  )
}

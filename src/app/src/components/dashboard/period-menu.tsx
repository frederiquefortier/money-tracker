import { useTranslation } from 'react-i18next'
import { ChoiceMenu } from '#/components/display/choice-menu'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'

const ALL = 'all'

/**
 * DSH-01, DSH-08: everything, the default, then each year from the newest, in one menu
 * (no ‹ › arrows, none other in the app).
 */
export function PeriodMenu({
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
  const value = period.unit === 'all' ? ALL : period.year
  const labelOf = (option: string) =>
    option === ALL ? t('dashboard.period.all') : option
  return (
    <ChoiceMenu
      label={t('dashboard.period.label', { period: labelOf(value) })}
      value={value}
      options={[
        ALL,
        ...(years.includes(value) || value === ALL ? [] : [value]),
        ...years,
      ]}
      labelOf={labelOf}
      onChange={(next) =>
        onChange(
          next === ALL
            ? { unit: 'all', year: today.slice(0, 4) }
            : { unit: 'year', year: next },
        )
      }
    />
  )
}

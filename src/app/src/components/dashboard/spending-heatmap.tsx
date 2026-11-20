import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { EmptyState } from '#/components/lists/list-card'
import { useFormatLocale, useLocale } from '#/hooks/app/use-locale'
import { heatLevel, heatSteps } from '#/lib/dashboard/daily-spending'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { formatDay, formatMonth } from '#/lib/shared/format'
import { monthWeeks } from '#/lib/events/event-calendar'
import { firstDayOf, weekdayNames } from '#/lib/shared/week'
import { cn } from '#/lib/utils'

const daysInYear = (year: string) =>
  new Date(Date.UTC(Number(year), 1, 29)).getUTCMonth() === 1 ? 366 : 365

// No spending (and days to come) in one neutral grey, then four steps of the spending
// red: one hue, light to dark (dataviz rule; author, 2026-11-19: a day without spending
// grey, as a day with no data yet).
const NONE = 'color-mix(in oklch, var(--muted-foreground) 7%, var(--card))'
const LEVELS = [
  NONE,
  'color-mix(in oklch, var(--flow-spent) 25%, var(--card))',
  'color-mix(in oklch, var(--flow-spent) 50%, var(--card))',
  'color-mix(in oklch, var(--flow-spent) 75%, var(--card))',
  'var(--flow-spent)',
]
const MISSING = 'color-mix(in oklch, var(--muted-foreground) 50%, var(--card))'

function Legend() {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {t('dashboard.heatmap.less')}
      {LEVELS.map((color) => (
        <span
          key={color}
          aria-hidden="true"
          className="size-3 rounded-[3px]"
          style={{ backgroundColor: color }}
        />
      ))}
      {t('dashboard.heatmap.more')}
    </span>
  )
}

/** The hovered day and what it cost, or nothing yet. */
function Caption({
  day,
  currency,
}: {
  day: DaySpent | null
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (!day) return <span />
  return (
    <span className="text-xs">
      <span className="text-muted-foreground first-letter:uppercase">
        {formatDay(day.day, locale)}
      </span>{' '}
      {day.spent === '0' ? (
        t('dashboard.heatmap.nothing')
      ) : (
        <Figure
          amount={day.spent}
          currency={currency}
          className="font-semibold"
        />
      )}
    </span>
  )
}

/** One day's square, or an empty slot before the 1st and after the last. */
function DayCell({
  day,
  today,
  spent,
  steps,
  onHover,
}: {
  day: string | null
  today: string
  spent: string | null | undefined
  steps: ReadonlyArray<number>
  onHover: (day: DaySpent | null) => void
}) {
  if (day === null) return <span />
  const future = day > today
  const background =
    spent === null ? MISSING : LEVELS[heatLevel(Number(spent ?? 0), steps)]
  return (
    <span
      className="aspect-square rounded-[3px]"
      style={{ backgroundColor: future ? NONE : background }}
      onMouseEnter={() => onHover(future ? null : { day, spent: spent ?? '0' })}
    />
  )
}

/**
 * The twelve months as small calendars, six across (three on a phone), so the year is no
 * taller than the monthly chart beside it (author, 2026-11-20).
 */
function MonthGrids({
  year,
  today,
  days,
  onHover,
}: {
  year: string
  today: string
  days: ReadonlyArray<DaySpent>
  onHover: (day: DaySpent | null) => void
}) {
  const locale = useLocale()
  const formatLocale = useFormatLocale()
  const firstDay = firstDayOf(formatLocale)
  const names = weekdayNames(formatLocale, firstDay)
  const byDay = new Map(days.map((d) => [d.day, d.spent]))
  const steps = heatSteps(days)
  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`,
  )
  return (
    <div
      className="grid grid-cols-3 gap-x-3 gap-y-3 sm:grid-cols-6"
      onMouseLeave={() => onHover(null)}
    >
      {months.map((month) => (
        <div key={month} className="flex flex-col gap-1">
          <span className="text-xs font-semibold capitalize">
            {formatMonth(month, locale, 'short')}
          </span>
          <div className="grid grid-cols-7 gap-[2px] text-center text-[0.625rem] leading-none text-muted-foreground">
            {names.map((name, i) => (
              <span key={i} aria-hidden="true">
                {name}
              </span>
            ))}
            {monthWeeks(month, firstDay)
              .flat()
              .map((day, i) => (
                <DayCell
                  key={day ?? `empty-${i}`}
                  day={day}
                  today={today}
                  spent={byDay.get(day ?? '')}
                  steps={steps}
                  onHover={onHover}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The year as a heat map of what I spent each day (author, 2026-11-19): the darker, the
 * more, in steps at the year's quartiles. Hovering a day names it and its amount.
 */
export function SpendingHeatmap({
  year,
  today,
  days,
  failed,
  currency,
}: {
  year: string
  today: string
  /** Null while loading. */
  days: ReadonlyArray<DaySpent> | null
  failed: boolean
  currency: string
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<DaySpent | null>(null)
  const count = days?.filter((d) => d.spent !== null).length ?? 0
  return (
    <DashboardCard
      title={t('dashboard.heatmap.title')}
      className="justify-between"
      actions={
        days && (
          <span
            className="font-mono text-sm text-muted-foreground"
            title={t('dashboard.heatmap.daysLabel', { count })}
            aria-label={t('dashboard.heatmap.daysLabel', { count })}
          >
            {t('dashboard.heatmap.days', { count, total: daysInYear(year) })}
          </span>
        )
      }
    >
      {failed ? (
        <EmptyState>{t('dashboard.heatmap.failed')}</EmptyState>
      ) : (
        <>
          <div
            role="img"
            aria-label={t('dashboard.heatmap.label', { year, count })}
            className={cn(!days && 'opacity-50')}
          >
            <MonthGrids
              year={year}
              today={today}
              days={days ?? []}
              onHover={setHovered}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Caption day={hovered} currency={currency} />
            <Legend />
          </div>
        </>
      )}
    </DashboardCard>
  )
}

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { EmptyState } from '#/components/lists/list-card'
import { useFormatLocale, useLocale } from '#/hooks/app/use-locale'
import { heatLevel, heatSteps } from '#/lib/dashboard/daily-spending'
import { daySearch } from '#/lib/dashboard/drill-down'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { formatDay, formatMonth } from '#/lib/shared/format'
import { monthWeeks } from '#/lib/events/event-calendar'
import { firstDayOf } from '#/lib/shared/week'
import { cn } from '#/lib/utils'

/** The days of the year gone by, today included: all of a past year's. */
function daysPassed(year: string, today: string): number {
  const start = Date.UTC(Number(year), 0, 1)
  const end = today.startsWith(year)
    ? Date.parse(`${today}T00:00:00Z`)
    : Date.UTC(Number(year), 11, 31)
  return Math.max(Math.round((end - start) / 86_400_000) + 1, 0)
}

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
  onOpen,
}: {
  day: string | null
  today: string
  spent: string | null | undefined
  steps: ReadonlyArray<number>
  onHover: (day: DaySpent | null) => void
  onOpen: (day: string) => void
}) {
  if (day === null) return <span />
  const future = day > today
  const background =
    spent === null ? MISSING : LEVELS[heatLevel(Number(spent ?? 0), steps)]
  return (
    <span
      className={cn('aspect-square rounded-[3px]', !future && 'cursor-pointer')}
      style={{ backgroundColor: future ? NONE : background }}
      onMouseEnter={() => onHover(future ? null : { day, spent: spent ?? '0' })}
      onClick={future ? undefined : () => onOpen(day)}
    />
  )
}

/**
 * The twelve months as small calendars, six across (three on a phone), so the year is no
 * taller than the monthly chart beside it (author, 2026-11-20); weeks start on the
 * locale's first day, without weekday letters. A day opens its transactions.
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
  const navigate = useNavigate()
  const firstDay = firstDayOf(formatLocale)
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
          <div className="grid grid-cols-7 gap-[2px]">
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
                  onOpen={(open) =>
                    void navigate({
                      to: '/transactions',
                      search: daySearch({ unit: 'year', year }, open),
                    })
                  }
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
            className="text-sm text-muted-foreground"
            title={t('dashboard.heatmap.daysLabel', {
              count,
              total: daysPassed(year, today),
            })}
          >
            {t('dashboard.heatmap.days', {
              count,
              total: daysPassed(year, today),
            })}
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
          {/* Room kept for the hovered day, so the card never changes height. */}
          <p className="h-5 truncate text-xs leading-5">
            <Caption day={hovered} currency={currency} />
          </p>
        </>
      )}
    </DashboardCard>
  )
}

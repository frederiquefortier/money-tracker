import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { EmptyState } from '#/components/lists/list-card'
import { DayGrid, DaysCount } from '#/components/dashboard/day-grid'
import { useLocale } from '#/hooks/app/use-locale'
import { heatSteps } from '#/lib/dashboard/daily-spending'
import { heatFill, heatFills } from '#/components/styles'
import { daySearch } from '#/lib/dashboard/drill-down'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { formatDay } from '#/lib/shared/format'
import { daysGoneBy, monthsOf } from '#/lib/shared/months'
import { cn } from '#/lib/utils'

/** The hovered day and what it cost, or nothing yet. */
function Caption({
  day,
  byDay,
  currency,
}: {
  day: string | null
  byDay: ReadonlyMap<string, string | null>
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (!day) return <span />
  const spent = byDay.has(day) ? (byDay.get(day) ?? null) : '0'
  return (
    <span className="text-xs">
      <span className="text-muted-foreground first-letter:uppercase">
        {formatDay(day, locale)}
      </span>{' '}
      {spent === '0' ? (
        t('dashboard.heatmap.nothing')
      ) : (
        <Figure amount={spent} currency={currency} className="font-semibold" />
      )}
    </span>
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
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const count = days?.filter((d) => d.spent !== null).length ?? 0
  const range = { from: `${year}-01-01`, to: `${year}-12-31` }
  const total = daysGoneBy(range, today)
  const byDay = new Map((days ?? []).map((d) => [d.day, d.spent]))
  const steps = heatSteps(days ?? [])
  return (
    <DashboardCard
      title={t('dashboard.heatmap.title')}
      className="justify-between"
      actions={
        days && (
          <DaysCount
            count={count}
            total={total}
            label={t('dashboard.heatmap.daysLabel', { count, total })}
          />
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
            <DayGrid
              months={monthsOf(range)}
              today={today}
              fillOf={(day, future) =>
                future ? heatFills.none : heatFill(byDay.get(day), steps)
              }
              onHover={setHovered}
              onOpen={(day) =>
                void navigate({
                  to: '/transactions',
                  search: daySearch({ unit: 'year', year }, day),
                })
              }
            />
          </div>
          {/* Room kept for the hovered day, so the card never changes height. */}
          <p className="h-5 truncate text-xs leading-5">
            <Caption day={hovered} byDay={byDay} currency={currency} />
          </p>
        </>
      )}
    </DashboardCard>
  )
}

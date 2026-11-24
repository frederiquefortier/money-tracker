import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { chipActive, chipSurface, focusRing } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import { useFollowActive } from '#/hooks/dashboard/use-follow-active'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { eventsInMonth } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import { formatMonth } from '#/lib/shared/format'
import { cn } from '#/lib/utils'

type RailProps = {
  months: ReadonlyArray<string>
  period: DashboardPeriod
  active: string | null
  onJump: (month: string) => void
}

function RailEntry({
  month,
  current,
  events,
  spent,
  currency,
  onJump,
}: {
  month: string
  current: boolean
  events: ReadonlyArray<EventSummary>
  spent: string | null | undefined
  currency: string
  onJump: (month: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <button
      type="button"
      aria-current={current ? 'true' : undefined}
      onClick={() => onJump(month)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
        current
          ? 'bg-secondary font-semibold text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        focusRing,
      )}
    >
      <span className="w-10 capitalize">
        {formatMonth(month, locale, 'short')}
      </span>
      <span
        className="flex flex-1 gap-0.5"
        title={t('dashboard.events.eventCount', { count: events.length })}
      >
        {events.slice(0, 4).map((e) => (
          <span
            key={e.event.id}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: e.color ?? 'var(--primary)' }}
          />
        ))}
      </span>
      {spent !== undefined && (
        <Figure
          amount={spent}
          currency={currency}
          className="text-xs tabular-nums"
        />
      )}
    </button>
  )
}

/**
 * YR-02 from `lg`: the period's months as a sticky column, each with its events' colours
 * and its spending, years as headings on Tout.
 */
export function MonthRail({
  months,
  period,
  active,
  onJump,
  summaries,
  totals,
  currency,
}: RailProps & {
  summaries: ReadonlyArray<EventSummary>
  totals: ReadonlyMap<string, string | null>
  currency: string
}) {
  const { t } = useTranslation()
  const [list, setList] = useState<HTMLOListElement | null>(null)
  useFollowActive(list, active, 'y')
  return (
    <nav
      aria-label={t('dashboard.events.months')}
      className="hidden w-48 shrink-0 lg:block"
    >
      <ol
        ref={setList}
        className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-0.5 overflow-y-auto pr-1"
      >
        {months.map((month, i) => (
          <li key={month} data-entry={month}>
            {period.unit === 'all' && (i === 0 || month.endsWith('-01')) && (
              <span className="mt-3 mb-1 block px-2 font-mono text-xs font-bold text-muted-foreground">
                {month.slice(0, 4)}
              </span>
            )}
            <RailEntry
              month={month}
              current={month === active}
              events={eventsInMonth(summaries, month)}
              spent={totals.get(month)}
              currency={currency}
              onJump={onJump}
            />
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Below `lg`, the months as a sticky row of chips under the app's header. */
export function MonthChips({ months, period, active, onJump }: RailProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [list, setList] = useState<HTMLDivElement | null>(null)
  useFollowActive(list, active, 'x')
  return (
    <nav
      aria-label={t('dashboard.events.months')}
      className="sticky top-[calc(4.25rem+env(safe-area-inset-top))] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur lg:hidden"
    >
      <div
        ref={setList}
        className="relative flex gap-2 overflow-x-auto [scrollbar-width:none]"
      >
        {months.map((month) => (
          <button
            key={month}
            type="button"
            data-entry={month}
            aria-current={month === active ? 'true' : undefined}
            onClick={() => onJump(month)}
            className={cn(
              chipSurface,
              'shrink-0 capitalize',
              month === active && chipActive,
            )}
          >
            {formatMonth(month, locale, 'short')}
            {period.unit === 'all' && ` ${month.slice(2, 4)}`}
          </button>
        ))}
      </div>
    </nav>
  )
}

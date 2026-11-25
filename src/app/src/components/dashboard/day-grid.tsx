import { useTranslation } from 'react-i18next'
import { useFormatLocale, useLocale } from '#/hooks/app/use-locale'
import { monthWeeks } from '#/lib/shared/months'
import { formatMonth } from '#/lib/shared/format'
import { firstDayOf } from '#/lib/shared/week'
import { cn } from '#/lib/utils'

type Props = {
  months: ReadonlyArray<string>
  today: string
  /** A day's fill; `future` past today. */
  fillOf: (day: string, future: boolean) => string
  onHover: (day: string | null) => void
  /** Opens a day gone by; days to come do not answer the pointer. */
  onOpen: (day: string) => void
  /** Puts the year beside January and the first month (Tout). */
  withYear?: boolean
}

function DayCell({
  day,
  today,
  fillOf,
  onHover,
  onOpen,
}: Pick<Props, 'today' | 'fillOf' | 'onHover' | 'onOpen'> & {
  day: string
}) {
  const future = day > today
  const active = !future
  return (
    <span
      className={cn('aspect-square rounded-[3px]', active && 'cursor-pointer')}
      style={{ background: fillOf(day, future) }}
      onMouseEnter={() => onHover(active ? day : null)}
      onClick={active ? () => onOpen(day) : undefined}
    />
  )
}

function MonthName({ month, withYear }: { month: string; withYear: boolean }) {
  const locale = useLocale()
  return (
    <span className="text-xs font-semibold capitalize">
      {formatMonth(month, locale, 'short')}
      {withYear && ` ${month.slice(0, 4)}`}
    </span>
  )
}

/**
 * Months as small calendars, six across (three on a phone), so a year is no taller than
 * the chart beside it; weeks start on the locale's first day, without
 * weekday letters. A history starting mid-year leaves its earlier months as blank places,
 * so each year keeps its rows.
 */
export function DayGrid({ months, withYear = false, ...cell }: Props) {
  const firstDay = firstDayOf(useFormatLocale())
  const before = Number(months[0]?.slice(5) ?? 1) - 1
  return (
    <div
      className="grid grid-cols-3 gap-3 sm:grid-cols-6"
      onMouseLeave={() => cell.onHover(null)}
    >
      {Array.from({ length: before % 6 }, (_, i) => (
        <span
          key={`before-${i}`}
          className={cn(i >= before % 3 && 'hidden sm:block')}
        />
      ))}
      {months.map((month, i) => (
        <div key={month} className="flex flex-col gap-1">
          <MonthName
            month={month}
            withYear={withYear && (i === 0 || month.endsWith('-01'))}
          />
          <div className="grid grid-cols-7 gap-[2px]">
            {monthWeeks(month, firstDay)
              .flat()
              .map((day, k) =>
                day === null ? (
                  <span key={`empty-${k}`} />
                ) : (
                  <DayCell key={day} day={day} {...cell} />
                ),
              )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** The card's corner: "239/324 jours", with what is counted as its title. */
export function DaysCount({
  count,
  total,
  label,
}: {
  count: number
  total: number
  label: string
}) {
  const { t } = useTranslation()
  return (
    <span className="text-sm text-muted-foreground" title={label}>
      {t('dashboard.heatmap.days', { count, total })}
    </span>
  )
}

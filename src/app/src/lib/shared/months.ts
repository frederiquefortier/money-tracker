// Calendar arithmetic on ISO strings ("2026-11-17", "2026-11"), in UTC so no time zone
// moves a day.

/** Both days included. */
export type DayRange = { from: string; to: string }

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function shiftMonth(month: string, by: number): string {
  const [year = 0, index = 1] = month.split('-').map(Number)
  const months = year * 12 + index - 1 + by
  return `${Math.floor(months / 12)}-${String((months % 12) + 1).padStart(2, '0')}`
}

export function monthEnd(month: string): string {
  const [year = 0, index = 1] = month.split('-').map(Number)
  return isoDay(new Date(Date.UTC(year, index, 0)))
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return isoDay(date)
}

/** Days from `from` to `to`, both included. */
export function daysIn(from: string, to: string): number {
  const ms =
    new Date(`${to}T00:00:00Z`).getTime() -
    new Date(`${from}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000) + 1
}

/**
 * The first day of the last `months` months to `today`: the day after the same date that
 * many months back, a short month taking its last day.
 */
export function monthsStart(today: string, months: number): string {
  const [year = 0, month = 1, day = 1] = today.split('-').map(Number)
  const back = new Date(Date.UTC(year, month - 1 - months, 1))
  const last = new Date(
    Date.UTC(back.getUTCFullYear(), back.getUTCMonth() + 1, 0),
  ).getUTCDate()
  back.setUTCDate(Math.min(day, last) + 1)
  return isoDay(back)
}

/** The days of a range gone by, today included: all of a range already over. */
export function daysGoneBy(range: DayRange, today: string): number {
  if (range.from > today) return 0
  return daysIn(range.from, range.to < today ? range.to : today)
}

export function monthsOf(range: DayRange): Array<string> {
  const months: Array<string> = []
  for (
    let month = monthOf(range.from);
    month <= monthOf(range.to);
    month = shiftMonth(month, 1)
  )
    months.push(month)
  return months
}

/**
 * A month as weeks of seven days, `firstDay` 1 (Monday) to 7 (Sunday) as Intl gives it;
 * null pads the days outside the month.
 */
export function monthWeeks(
  month: string,
  firstDay: number,
): Array<Array<string | null>> {
  const first = `${month}-01`
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay() || 7
  const lead = (weekday - firstDay + 7) % 7
  const cells: Array<string | null> = Array.from({ length: lead }, () => null)
  for (let day = first; day <= monthEnd(month); day = addDays(day, 1))
    cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

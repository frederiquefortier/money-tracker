// The locale's week: its first day and the days' short names, from Intl.

/** The locale's first day of the week, 1 (Monday) to 7 (Sunday). */
export function firstDayOf(locale: string): number {
  const info = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => { firstDay: number }
    weekInfo?: { firstDay: number }
  }
  return info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay ?? 7
}

export function weekdayNames(
  locale: string,
  firstDay: number,
  style: 'narrow' | 'short' = 'narrow',
): Array<string> {
  const format = new Intl.DateTimeFormat(locale, {
    weekday: style,
    timeZone: 'UTC',
  })
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    format.format(new Date(Date.UTC(2024, 0, ((firstDay - 1 + i) % 7) + 1))),
  )
}

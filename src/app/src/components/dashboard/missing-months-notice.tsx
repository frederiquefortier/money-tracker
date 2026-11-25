import { useTranslation } from 'react-i18next'
import { FormAlert } from '#/components/forms/form-field'
import { useFormatLocale, useLocale } from '#/hooks/app/use-locale'
import { formatMonth } from '#/lib/shared/format'
import { shiftMonth } from '#/lib/shared/months'

/** Consecutive months as runs: ["2025-04", "2025-05", "2025-09"] to two runs. */
function runsOf(months: ReadonlyArray<string>): Array<[string, string]> {
  const runs: Array<[string, string]> = []
  for (const month of months) {
    const last = runs.at(-1)
    if (last && shiftMonth(last[1], 1) === month) last[1] = month
    else runs.push([month, month])
  }
  return runs
}

/**
 * The period's holes in the history, months without a single transaction, as a tag beside
 * the page title like the net worth page's.
 */
export function MissingMonthsNotice({
  months,
}: {
  months: ReadonlyArray<string>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const formatLocale = useFormatLocale()
  if (months.length === 0) return null
  const names = runsOf(months).map(([from, to]) =>
    from === to
      ? t('dashboard.missing.month', { month: formatMonth(from, locale) })
      : t('dashboard.missing.range', {
          from: formatMonth(from, locale),
          to: formatMonth(to, locale),
        }),
  )
  const list = new Intl.ListFormat(formatLocale, { type: 'conjunction' })
  return (
    <FormAlert tone="warning" size="tag" className="w-fit max-w-full">
      {t('dashboard.missing.notice', {
        count: months.length,
        months: list.format(names),
      })}
    </FormAlert>
  )
}

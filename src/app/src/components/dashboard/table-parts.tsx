import { useTranslation } from 'react-i18next'
import { tablePanel } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import type { TableColumn } from '#/lib/dashboard/category-table'
import { formatMonth, todayIso } from '#/lib/shared/format'

// What the category and merchant tables share.

/** What a row opens, on its own row under it and within the card's width. */
export function TablePanel({
  id,
  colSpan,
  children,
}: {
  id: string
  colSpan: number
  children: React.ReactNode
}) {
  return (
    <tr id={id} className="border-b">
      <td colSpan={colSpan} className="p-0">
        <div className={tablePanel}>{children}</div>
      </td>
    </tr>
  )
}

/** On the current year, "Ce mois-ci" and "Cette année"; on a past one, its December and itself. */
export function ColumnHead({ column }: { column: TableColumn }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const now = column.to === todayIso().slice(0, 7)
  if (column.kind === 'year') return column.key
  if (column.kind === 'total') return t('dashboard.period.all')
  if (column.kind === 'thisMonth' && !now)
    return <span className="capitalize">{formatMonth(column.to, locale)}</span>
  if (column.kind === 'thisYear' && !now) return column.to.slice(0, 4)
  return t(`dashboard.table.columns.${column.kind}`)
}

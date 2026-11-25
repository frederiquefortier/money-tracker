import { useTranslation } from 'react-i18next'
import { STICKY } from '#/components/dashboard/category-table-row'
import { useLocale } from '#/hooks/app/use-locale'
import type { TableColumn } from '#/lib/dashboard/category-table'
import { formatMonth, todayIso } from '#/lib/shared/format'
import { tableFigureHead, tableNameHead } from '#/components/styles'
import { cn } from '#/lib/utils'

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

export function CategoryTableHead({
  columns,
  compared,
}: {
  columns: ReadonlyArray<TableColumn>
  /** The year the change column compares against. */
  compared: string | null
}) {
  const { t } = useTranslation()
  return (
    <thead>
      <tr className="border-b text-left text-xs text-muted-foreground">
        <th className={cn(STICKY, 'py-2 pr-3 pl-4 font-semibold')}>
          <span className={tableNameHead}>{t('dashboard.table.category')}</span>
        </th>
        {columns.map((column) => (
          <th
            key={column.key}
            className="py-2 pl-6 text-right font-semibold whitespace-nowrap"
          >
            <span className={tableFigureHead}>
              <ColumnHead column={column} />
            </span>
          </th>
        ))}
        <th className="py-2 pl-6 text-right font-semibold whitespace-nowrap">
          {t('dashboard.table.transactions')}
        </th>
        {compared && (
          <th className="py-2 pl-6 text-right font-semibold whitespace-nowrap">
            {t('dashboard.table.change', { year: compared })}
          </th>
        )}
        <th className="w-full py-2 pr-4 pl-6 text-right font-semibold">
          {t('dashboard.table.trend')}
        </th>
      </tr>
    </thead>
  )
}

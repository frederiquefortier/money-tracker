import { useTranslation } from 'react-i18next'
import { ColumnHead } from '#/components/dashboard/table-parts'
import type { TableColumn } from '#/lib/dashboard/category-table'
import {
  tableFigureHead,
  tableNameHead,
  tableStickyCell,
} from '#/components/styles'
import { cn } from '#/lib/utils'

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
        <th className={cn(tableStickyCell, 'py-2 pr-3 pl-4 font-semibold')}>
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

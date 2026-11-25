import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnHead } from '#/components/dashboard/category-table-head'
import { STICKY } from '#/components/dashboard/category-table-row'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { MerchantTableRow } from '#/components/dashboard/merchant-table-row'
import { SearchField } from '#/components/forms/search-field'
import { EmptyState } from '#/components/lists/list-card'
import { Revealed } from '#/components/lists/revealed'
import { SortMenu } from '#/components/lists/sort-menu'
import { TableScroll } from '#/components/lists/table-scroll'
import { tableFigureHead, tableNameHead } from '#/components/styles'
import { changeSpans, changeYear } from '#/lib/dashboard/category-change'
import type { TableColumn } from '#/lib/dashboard/category-table'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { MERCHANT_SORTS } from '#/lib/dashboard/merchant-bills'
import type { MerchantRow, MerchantSort } from '#/lib/dashboard/merchant-bills'
import { matcher } from '#/lib/shared/search'
import { cn } from '#/lib/utils'

const STEP = 30
const HEAD = 'py-2 pl-6 text-right font-semibold whitespace-nowrap'

type SortedBy = { column: 'name' | 'amount' | 'count'; desc: boolean }

function sortedBy(sort: MerchantSort): SortedBy {
  const desc = sort.endsWith('Desc')
  if (sort.startsWith('name')) return { column: 'name', desc }
  if (sort.startsWith('count')) return { column: 'count', desc }
  return { column: 'amount', desc }
}

/** A head the list is sorted by says so to screen readers only (author, 2026-11-20). */
function SortedHead({
  sorted,
  className,
  children,
}: {
  sorted: boolean | null
  className: string
  children: React.ReactNode
}) {
  const order = sorted ? 'descending' : 'ascending'
  return (
    <th className={className} aria-sort={sorted === null ? undefined : order}>
      {children}
    </th>
  )
}

function MerchantTableHead({
  columns,
  whole,
  sort,
}: {
  columns: ReadonlyArray<TableColumn>
  whole: boolean
  sort: MerchantSort
}) {
  const { t } = useTranslation()
  const { column: by, desc } = sortedBy(sort)
  // An amount sort reads the period's total: the whole history's on everything.
  const amountKey = whole
    ? null
    : columns.find((c) => c.kind === 'thisYear')?.key
  const on = (column: SortedBy['column'], matches = true) =>
    by === column && matches ? desc : null
  return (
    <thead>
      <tr className="border-b text-left text-xs text-muted-foreground">
        <SortedHead
          sorted={on('name')}
          className={cn(STICKY, 'py-2 pr-3 pl-4 font-semibold')}
        >
          <span className={tableNameHead}>
            {t('dashboard.merchants.merchant')}
          </span>
        </SortedHead>
        {columns.map((column) => (
          <SortedHead
            key={column.key}
            sorted={on('amount', column.key === amountKey)}
            className={HEAD}
          >
            <span className={tableFigureHead}>
              <ColumnHead column={column} />
            </span>
          </SortedHead>
        ))}
        {whole && (
          <SortedHead sorted={on('amount')} className={HEAD}>
            <span className={tableFigureHead}>{t('dashboard.period.all')}</span>
          </SortedHead>
        )}
        <SortedHead sorted={on('count')} className={HEAD}>
          {t('dashboard.table.transactions')}
        </SortedHead>
        <th className="w-full py-2 pr-4 pl-6 text-right font-semibold">
          {t('dashboard.table.trend')}
        </th>
      </tr>
    </thead>
  )
}

type MerchantTableProps = {
  rows: ReadonlyArray<MerchantRow>
  sort: MerchantSort
  /** The category table's columns, whose stretch and comparison this card shares. */
  columns: ReadonlyArray<TableColumn>
  trendKeys: ReadonlyArray<string>
  period: DashboardPeriod
  current: string
  currency: string
}

/** The rows built as they near the screen, one open at a time. */
function MerchantTable({
  rows,
  sort,
  columns,
  trendKeys,
  period,
  current,
  currency,
}: MerchantTableProps) {
  const [open, setOpen] = useState<string | null>(null)
  // Totals only: no average per month or year (author, 2026-11-20).
  // On everything, the whole history's total after the years (author, 2026-11-20).
  const whole = columns.some((c) => c.kind === 'year')
  // Its own whole-history column sorts by amount, so the table's is left out.
  const totals = columns.filter(
    (c) =>
      c.kind !== 'averageMonth' &&
      c.kind !== 'averageYear' &&
      c.kind !== 'total',
  )
  const spans = changeSpans(columns)
  const compared = spans ? changeYear(spans) : null
  const lastYear = columns.some((c) => c.kind === 'thisYear') ? compared : null
  return (
    <Revealed items={rows} step={STEP} as="div">
      {(shown) => (
        <TableScroll>
          <table className="w-full min-w-[34rem] text-sm">
            <MerchantTableHead columns={totals} whole={whole} sort={sort} />
            <tbody>
              {shown.map((row) => (
                <MerchantTableRow
                  key={row.merchant.id}
                  row={row}
                  columns={totals}
                  whole={whole}
                  chart={{
                    open: open === row.merchant.id,
                    onToggle: () =>
                      setOpen(
                        open === row.merchant.id ? null : row.merchant.id,
                      ),
                    keys: trendKeys,
                    current,
                  }}
                  compared={compared}
                  lastYear={lastYear}
                  period={period}
                  currency={currency}
                />
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Revealed>
  )
}

/**
 * MER-04: each merchant's totals in the category table's columns (and the whole history's
 * on everything), its transactions and its trend, at my share, sorted as the category
 * table plus by count, found by name, built as they near the screen (author, 2026-11-20).
 * A row's chevron or trend opens its bill as a receipt beside its total per month.
 */
export function MerchantTableCard({
  onSort,
  ...table
}: MerchantTableProps & { onSort: (sort: MerchantSort) => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const { rows } = table
  const found = useMemo(() => {
    const matches = matcher(query)
    return rows.filter((row) => matches(row.merchant.name))
  }, [rows, query])
  const empty = rows.length === 0 ? t('dashboard.empty') : t('common.noMatch')
  return (
    <DashboardCard
      title={t('dashboard.merchants.title')}
      actions={
        <>
          {rows.length > 0 && (
            <div className="w-full sm:w-56">
              <SearchField
                value={query}
                onChange={setQuery}
                label={t('dashboard.merchants.search')}
              />
            </div>
          )}
          <SortMenu
            sort={table.sort}
            options={MERCHANT_SORTS}
            labelOf={(option) => t(`dashboard.merchants.sort.${option}`)}
            onChange={onSort}
          />
        </>
      }
    >
      {found.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <MerchantTable {...table} rows={found} />
      )}
    </DashboardCard>
  )
}

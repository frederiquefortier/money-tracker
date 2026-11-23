import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Cell,
  FoldButton,
  TrendButton,
} from '#/components/dashboard/category-table-cells'
import { drawn } from '#/components/dashboard/chart-parts'
import { STICKY } from '#/components/dashboard/category-table-row'
import { MerchantReceipt } from '#/components/dashboard/merchant-receipt'
import { TablePanel } from '#/components/dashboard/table-panel'
import { TrendChart } from '#/components/dashboard/trend-chart'
import { focusRing, rowHover, tableNameWidth } from '#/components/styles'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { periodSearch } from '#/lib/dashboard/drill-down'
import type { TableColumn } from '#/lib/dashboard/category-table'
import type { MerchantRow } from '#/lib/dashboard/merchant-bills'
import { cn } from '#/lib/utils'

export type MerchantChart = {
  open: boolean
  onToggle: () => void
  keys: ReadonlyArray<string>
  current: string
}

const CELL = 'py-1.5 pl-6 text-right whitespace-nowrap tabular-nums'

// The app's purple, for the trend and the bars: the spending red read as an alarm on every
// merchant (author, 2026-11-20).
const BAR_COLOR = 'var(--primary)'

/** The slip of the merchant's typical bill beside what it cost each month (or year). */
function MerchantPanel({
  row,
  chart,
  compared,
  lastYear,
  currency,
}: {
  row: MerchantRow
  chart: MerchantChart
  compared: string | null
  lastYear: string | null
  currency: string
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <MerchantReceipt row={row} compared={compared} currency={currency} />
      <div className="w-full min-w-0 flex-1">
        <TrendChart
          keys={chart.keys}
          values={row.trend}
          lastYear={
            row.lastYearTrend && lastYear
              ? { values: row.lastYearTrend, label: lastYear }
              : null
          }
          label={row.merchant.name}
          color={BAR_COLOR}
          current={chart.current}
          currency={currency}
          className="sm:h-full sm:min-h-44"
        />
      </div>
    </div>
  )
}

function NameCell({
  row,
  chart,
  panel,
  period,
}: {
  row: MerchantRow
  chart: MerchantChart
  panel: string
  period: DashboardPeriod
}) {
  const { merchant } = row
  return (
    <td className={cn(STICKY, tableNameWidth, 'py-1.5 pr-3 pl-3')}>
      <span className="flex items-center gap-2">
        <FoldButton
          fold={{ folds: true, open: chart.open, onToggle: chart.onToggle }}
          name={merchant.name}
          panel={panel}
        />
        <Link
          to="/transactions"
          search={{ ...periodSearch(period), merchant: [merchant.id] }}
          className={cn('truncate rounded-md hover:underline', focusRing)}
        >
          {merchant.name}
        </Link>
      </span>
    </td>
  )
}

/**
 * A merchant's row: its chevron or its trend opens the slip of its typical bill beside its
 * total per month, as a category's trend opens its chart; its name opens its transactions
 * over the period. A month without a visit is a zero on the line, never a break
 * (author, 2026-11-20); only a missing rate breaks it.
 */
export function MerchantTableRow({
  row,
  columns,
  whole,
  chart,
  compared,
  lastYear,
  period,
  currency,
}: {
  row: MerchantRow
  columns: ReadonlyArray<TableColumn>
  /** On everything: a column with the whole history's total. */
  whole: boolean
  chart: MerchantChart
  /** The year the slip compares with. */
  compared: string | null
  /** The dashed line's year, on a year only. */
  lastYear: string | null
  period: DashboardPeriod
  currency: string
}) {
  const panel = useId()
  const locale = useFormatLocale()
  const { merchant, figures } = row
  return (
    <>
      <tr className={cn('border-b last:border-0', rowHover)}>
        <NameCell row={row} chart={chart} panel={panel} period={period} />
        {columns.map((column) => (
          <td key={column.key} className={CELL}>
            <Cell
              amount={row.columns[column.key] ?? null}
              above={false}
              currency={currency}
            />
          </td>
        ))}
        {whole && (
          <td className={CELL}>
            <Cell amount={figures.total} above={false} currency={currency} />
          </td>
        )}
        <td className={cn(CELL, 'font-mono')}>
          {figures.visits.toLocaleString(locale)}
        </td>
        <td className="py-1 pr-4 pl-6">
          <TrendButton
            name={merchant.name}
            color={BAR_COLOR}
            open={chart.open}
            panel={panel}
            values={row.trend.map(drawn)}
            onToggle={chart.onToggle}
          />
        </td>
      </tr>
      {chart.open && (
        <TablePanel id={panel} colSpan={columns.length + (whole ? 4 : 3)}>
          <MerchantPanel
            row={row}
            chart={chart}
            compared={compared}
            lastYear={lastYear}
            currency={currency}
          />
        </TablePanel>
      )}
    </>
  )
}

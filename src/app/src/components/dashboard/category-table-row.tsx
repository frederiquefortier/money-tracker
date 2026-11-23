import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { CategoryBadge } from '#/components/categories/category-badge'
import { drawn } from '#/components/dashboard/chart-parts'
import {
  Cell,
  ChangeCell,
  FoldButton,
  TrendButton,
} from '#/components/dashboard/category-table-cells'
import type { Fold } from '#/components/dashboard/category-table-cells'
import { TablePanel } from '#/components/dashboard/table-panel'
import { TrendChart } from '#/components/dashboard/trend-chart'
import { TreeGuides } from '#/components/lists/tree-guides'
import { focusRing, rowHover, tableNameWidth } from '#/components/styles'
import { isAboveAverage } from '#/lib/dashboard/category-table'
import type { TableColumn, TableRow } from '#/lib/dashboard/category-table'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { periodSearch } from '#/lib/dashboard/drill-down'
import type { TreeGuide } from '#/lib/shared/tree-layout'
import { cn } from '#/lib/utils'

// Opaque in the row's colour, hover included, so the sticky column hides what scrolls under it.
// Its own fade, as the row's: a custom property change alone would swap it at once. Its
// right border is a shadow: a collapsed table's border stays put while the cell sticks.
export const STICKY =
  'sticky left-0 z-10 bg-[var(--row-bg,var(--card))] shadow-[inset_-1px_0_0_var(--border)] transition-colors'

function NameCell({
  row,
  guide,
  fold,
  period,
}: {
  row: TableRow
  guide: TreeGuide
  fold: Fold
  period: DashboardPeriod
}) {
  const { category, depth } = row
  return (
    <td className={cn(STICKY, tableNameWidth, 'py-1.5 pr-3 pl-3')}>
      <span
        className={cn(
          'flex items-center gap-2',
          depth === 0 && 'font-semibold',
        )}
      >
        {depth === 0 && <FoldButton fold={fold} name={category.name} />}
        <TreeGuides guide={guide} className="-my-1.5 -mr-1 ml-4" />
        <Link
          to="/transactions"
          search={periodSearch(period, category.id)}
          className={cn(
            'flex min-w-0 items-center gap-2 rounded-md hover:underline',
            focusRing,
          )}
        >
          <CategoryBadge
            icon={category.icon}
            color={category.color}
            size="sm"
          />
          <span className="truncate">{category.name}</span>
        </Link>
      </span>
    </td>
  )
}

function FigureCells({
  row,
  columns,
  markAbove,
  currency,
}: {
  row: TableRow
  columns: ReadonlyArray<TableColumn>
  markAbove: boolean
  currency: string
}) {
  return columns.map((column) => (
    <td
      key={column.key}
      className={cn(
        'py-1.5 pl-6 text-right whitespace-nowrap',
        row.depth === 0 && 'font-semibold',
      )}
    >
      <Cell
        amount={row.figures[column.key] ?? null}
        above={
          markAbove &&
          column.kind === 'thisMonth' &&
          isAboveAverage(row.figures)
        }
        currency={currency}
      />
    </td>
  ))
}

type RowChart = {
  open: boolean
  onToggle: () => void
  keys: ReadonlyArray<string>
  /** Months without any transaction: a break in the line, never a drop to zero. */
  gaps: ReadonlyArray<string>
  current: string
}

/** The change column, when there is an earlier year to compare with. */
type RowChange = {
  shown: boolean
  lowerIsBetter: boolean
  /** The dashed line's year, on a year only. */
  lastYear: string | null
}

function lastYearOf(row: TableRow, change: RowChange) {
  return row.lastYearTrend && change.lastYear
    ? { values: row.lastYearTrend, label: change.lastYear }
    : null
}

/**
 * A category's row: a group folds its categories; the trend opens the category's chart
 * under the row, as an item's line does on the net worth page (author, 2026-11-19).
 */
export function CategoryTableRow({
  row,
  guide,
  fold,
  chart,
  period,
  columns,
  markAbove,
  change,
  currency,
}: {
  row: TableRow
  guide: TreeGuide
  fold: Fold
  chart: RowChart
  period: DashboardPeriod
  columns: ReadonlyArray<TableColumn>
  markAbove: boolean
  change: RowChange
  currency: string
}) {
  const panel = useId()
  const { category } = row
  const values = row.trend.map((value, i) =>
    chart.gaps.includes(chart.keys[i] ?? '') ? null : drawn(value),
  )
  return (
    <>
      <tr className={cn('border-b last:border-0', rowHover)}>
        <NameCell row={row} guide={guide} fold={fold} period={period} />
        <FigureCells
          row={row}
          columns={columns}
          markAbove={markAbove}
          currency={currency}
        />
        {change.shown && (
          <ChangeCell
            change={row.change}
            lowerIsBetter={change.lowerIsBetter}
            currency={currency}
          />
        )}
        <td className="py-1 pr-4 pl-6">
          <TrendButton
            name={category.name}
            color={category.color}
            open={chart.open}
            panel={panel}
            values={values}
            onToggle={chart.onToggle}
          />
        </td>
      </tr>
      {chart.open && (
        <TablePanel
          id={panel}
          colSpan={columns.length + (change.shown ? 3 : 2)}
        >
          <TrendChart
            keys={chart.keys}
            values={row.trend}
            lastYear={lastYearOf(row, change)}
            label={category.name}
            color={category.color}
            current={chart.current}
            currency={currency}
          />
        </TablePanel>
      )}
    </>
  )
}

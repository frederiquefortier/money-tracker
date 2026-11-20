import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { drawn } from '#/components/dashboard/chart-parts'
import { Figure } from '#/components/dashboard/dashboard-card'
import { TrendChart } from '#/components/dashboard/trend-chart'
import { Icon } from '#/components/display/icon'
import { Sparkline } from '#/components/display/sparkline'
import { TreeGuides } from '#/components/lists/tree-guides'
import { focusRing } from '#/components/styles'
import { isAboveAverage } from '#/lib/dashboard/category-table'
import type { TableColumn, TableRow } from '#/lib/dashboard/category-table'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { periodSearch } from '#/lib/dashboard/drill-down'
import type { TreeGuide } from '#/lib/shared/tree-layout'
import { cn } from '#/lib/utils'

export const STICKY = 'sticky left-0 z-10'
const UP = '▲'

type Fold = { folds: boolean; open: boolean; onToggle: () => void }

/** A group's chevron, or the same room for a row that does not fold. */
function FoldButton({ fold, name }: { fold: Fold; name: string }) {
  const { t } = useTranslation()
  if (!fold.folds)
    return <span aria-hidden="true" className="size-6 shrink-0" />
  return (
    <button
      type="button"
      aria-expanded={fold.open}
      aria-label={t(fold.open ? 'common.collapseName' : 'common.expandName', {
        name,
      })}
      onClick={fold.onToggle}
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-md hover:bg-secondary',
        focusRing,
      )}
    >
      <Icon
        name="chevron-down"
        className={cn(
          'size-4 transition-transform',
          !fold.open && '-rotate-90',
        )}
      />
    </button>
  )
}

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
    <td
      className={cn(
        STICKY,
        // Opaque, so the sticky column hides what scrolls under it.
        'max-w-48 bg-card py-1.5 pr-3 pl-3 sm:max-w-none',
      )}
    >
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

function Cell({
  amount,
  above,
  currency,
}: {
  amount: string | null
  above: boolean
  currency: string
}) {
  const { t } = useTranslation()
  const zero = amount !== null && /^-?0(\.0+)?$/.test(amount)
  return (
    <span className={cn(above && 'text-destructive')}>
      {above && (
        <span
          role="img"
          aria-label={t('dashboard.table.aboveAverage')}
          title={t('dashboard.table.aboveAverage')}
          className="mr-1 text-xs"
        >
          {UP}
        </span>
      )}
      <Figure
        amount={amount}
        currency={currency}
        className={zero ? 'text-muted-foreground' : undefined}
      />
    </span>
  )
}

/** The row's line, a button that opens its chart under the row. */
function TrendButton({
  row,
  open,
  panel,
  values,
  onToggle,
}: {
  row: TableRow
  open: boolean
  panel: string
  values: ReadonlyArray<number | null>
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panel}
      aria-label={t(
        open ? 'dashboard.table.hideChart' : 'dashboard.table.showChart',
        { name: row.category.name },
      )}
      onClick={onToggle}
      className={cn(
        'ml-auto flex w-full max-w-sm min-w-20 rounded-md p-0.5 hover:bg-secondary',
        open && 'bg-secondary',
        focusRing,
      )}
    >
      <Sparkline
        values={values}
        color={row.category.color}
        className="h-5 w-full"
      />
    </button>
  )
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
  currency,
}: {
  row: TableRow
  guide: TreeGuide
  fold: Fold
  chart: {
    open: boolean
    onToggle: () => void
    keys: ReadonlyArray<string>
    /** Months without any transaction: a break in the line, never a drop to zero. */
    gaps: ReadonlyArray<string>
    current: string
  }
  period: DashboardPeriod
  columns: ReadonlyArray<TableColumn>
  markAbove: boolean
  currency: string
}) {
  const panel = useId()
  const { category, depth } = row
  const values = row.trend.map((value, i) =>
    chart.gaps.includes(chart.keys[i] ?? '') ? null : drawn(value),
  )
  return (
    <>
      <tr className="border-b last:border-0">
        <NameCell row={row} guide={guide} fold={fold} period={period} />
        {columns.map((column) => (
          <td
            key={column.key}
            className={cn(
              'py-1.5 pl-6 text-right whitespace-nowrap',
              depth === 0 && 'font-semibold',
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
        ))}
        <td className="py-1 pr-4 pl-6">
          <TrendButton
            row={row}
            open={chart.open}
            panel={panel}
            values={values}
            onToggle={chart.onToggle}
          />
        </td>
      </tr>
      {chart.open && (
        <tr id={panel} className="border-b">
          <td colSpan={columns.length + 2} className="px-4 pt-4 pb-3">
            <TrendChart
              keys={chart.keys}
              values={row.trend}
              label={category.name}
              color={category.color}
              current={chart.current}
              currency={currency}
            />
          </td>
        </tr>
      )}
    </>
  )
}

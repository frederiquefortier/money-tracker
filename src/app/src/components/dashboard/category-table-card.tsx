import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import {
  CategoryTableRow,
  STICKY,
} from '#/components/dashboard/category-table-row'
import { FLOW_COLORS } from '#/components/dashboard/chart-parts'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { EmptyState } from '#/components/lists/list-card'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import { KINDS } from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'
import { TABLE_SORTS, shownRows } from '#/lib/dashboard/category-table'
import type {
  TableColumn,
  TableRow,
  TableSort,
} from '#/lib/dashboard/category-table'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { formatMonth, todayIso } from '#/lib/shared/format'
import { treeGuides } from '#/lib/shared/tree-layout'
import { cn } from '#/lib/utils'

const PANEL = 'category-table'

// Each type in its flow's colour, as the summary (author, 2026-11-20).
const KIND_COLORS: Record<CategoryKind, string> = {
  expense: FLOW_COLORS.spent,
  income: FLOW_COLORS.earned,
  investment: FLOW_COLORS.invested,
}

/** Expand-all, the sort, and the type as three colour dots (author, 2026-11-20). */
function TableControls({
  kind,
  onKind,
  sort,
  onSort,
  groups,
  open,
}: {
  kind: CategoryKind
  onKind: (kind: CategoryKind) => void
  sort: TableSort
  onSort: (sort: TableSort) => void
  groups: ReadonlyArray<string>
  open: ReturnType<typeof useStoredIds>
}) {
  const { t } = useTranslation()
  const allOpen = groups.length > 0 && groups.every((id) => open.ids.has(id))
  return (
    <>
      {groups.length > 0 && (
        <ExpandAllButton
          allExpanded={allOpen}
          onToggle={() => open.setAll(groups, !allOpen)}
        />
      )}
      <SortMenu
        sort={sort}
        options={TABLE_SORTS}
        labelOf={(option) => t(`dashboard.table.sort.${option}`)}
        onChange={onSort}
      />
      <TabList
        label={t('dashboard.categories.kindsLabel')}
        tabs={KINDS}
        value={kind}
        labelOf={(value) => t(`categories.kinds.${value}`)}
        dot={(value) => KIND_COLORS[value]}
        panelId={PANEL}
        idPrefix="table-kind"
        fit
        onSelect={onKind}
      />
    </>
  )
}

/**
 * The sheet's table, figures only: each group folding its categories, then on a year this
 * month, the year so far and the monthly average; on everything, a total per year and the
 * yearly average; the trend last, across what is left, opening its chart (author,
 * 2026-11-20: the figures beside their names). Spending well above its average this month
 * is marked. A category's name opens its transactions over the period.
 */
export function CategoryTableCard({
  kind,
  onKind,
  sort,
  onSort,
  columns,
  rows,
  trendKeys,
  gaps,
  period,
  current,
  currency,
}: {
  kind: CategoryKind
  onKind: (kind: CategoryKind) => void
  sort: TableSort
  onSort: (sort: TableSort) => void
  columns: ReadonlyArray<TableColumn>
  rows: ReadonlyArray<TableRow>
  /** The months (or years) each row's trend covers. */
  trendKeys: ReadonlyArray<string>
  /** Months without any transaction, a break in each trend. */
  gaps: ReadonlyArray<string>
  period: DashboardPeriod
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const open = useStoredIds('dashboard.table.open')
  // The groups with categories under them, which the expand-all button opens or closes.
  const groups = shownRows(rows, new Set())
    .filter(({ folds }) => folds)
    .map(({ row }) => row.category.id)
  return (
    <DashboardCard
      title={t('dashboard.table.title')}
      actions={
        <TableControls
          kind={kind}
          onKind={onKind}
          sort={sort}
          onSort={onSort}
          groups={groups}
          open={open}
        />
      }
    >
      <div id={PANEL} role="tabpanel" aria-labelledby={`table-kind-${kind}`}>
        {rows.length === 0 ? (
          <EmptyState>{t('dashboard.empty')}</EmptyState>
        ) : (
          <FiguresTable
            columns={columns}
            rows={rows}
            open={open}
            markAbove={kind === 'expense'}
            trendKeys={trendKeys}
            gaps={gaps}
            period={period}
            current={current}
            currency={currency}
          />
        )}
      </div>
    </DashboardCard>
  )
}

/** On the current year, "Ce mois-ci" and "Cette année"; on a past one, its December and itself. */
function ColumnHead({ column }: { column: TableColumn }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const now = column.to === todayIso().slice(0, 7)
  if (column.kind === 'year') return column.key
  if (column.kind === 'thisMonth' && !now)
    return <span className="capitalize">{formatMonth(column.to, locale)}</span>
  if (column.kind === 'thisYear' && !now) return column.to.slice(0, 4)
  return t(`dashboard.table.columns.${column.kind}`)
}

function TableHead({ columns }: { columns: ReadonlyArray<TableColumn> }) {
  const { t } = useTranslation()
  return (
    <thead>
      <tr className="border-b text-left text-xs text-muted-foreground">
        <th className={cn(STICKY, 'bg-card py-2 pr-3 pl-4 font-semibold')}>
          {t('dashboard.table.category')}
        </th>
        {columns.map((column) => (
          <th
            key={column.key}
            className="py-2 pl-6 text-right font-semibold whitespace-nowrap"
          >
            <ColumnHead column={column} />
          </th>
        ))}
        <th className="w-full py-2 pr-4 pl-6 text-right font-semibold">
          {t('dashboard.table.trend')}
        </th>
      </tr>
    </thead>
  )
}

function FiguresTable({
  columns,
  rows,
  open,
  markAbove,
  trendKeys,
  gaps,
  period,
  current,
  currency,
}: {
  columns: ReadonlyArray<TableColumn>
  rows: ReadonlyArray<TableRow>
  open: ReturnType<typeof useStoredIds>
  markAbove: boolean
  trendKeys: ReadonlyArray<string>
  gaps: ReadonlyArray<string>
  period: DashboardPeriod
  current: string
  currency: string
}) {
  const [charts, setCharts] = useState<ReadonlySet<string>>(new Set())
  const toggleChart = (id: string) => {
    const next = new Set(charts)
    if (!next.delete(id)) next.add(id)
    setCharts(next)
  }
  const shown = shownRows(rows, open.ids)
  const guides = treeGuides(shown.map(({ row }) => row.depth))
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <TableHead columns={columns} />
        <tbody>
          {shown.map(({ row, folds }, i) => (
            <CategoryTableRow
              key={row.category.id}
              row={row}
              guide={guides[i]}
              fold={{
                folds,
                open: open.ids.has(row.category.id),
                onToggle: () => open.toggle(row.category.id),
              }}
              chart={{
                open: charts.has(row.category.id),
                onToggle: () => toggleChart(row.category.id),
                keys: trendKeys,
                gaps,
                current,
              }}
              period={period}
              columns={columns}
              markAbove={markAbove}
              currency={currency}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

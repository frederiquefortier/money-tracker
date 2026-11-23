import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { CategoryTableHead } from '#/components/dashboard/category-table-head'
import { CategoryTableRow } from '#/components/dashboard/category-table-row'
import { FLOW_COLORS } from '#/components/dashboard/chart-parts'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { TableScroll } from '#/components/lists/table-scroll'
import { EmptyState } from '#/components/lists/list-card'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import { KINDS } from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'
import { changeSpans, changeYear } from '#/lib/dashboard/category-change'
import { TABLE_SORTS, shownRows } from '#/lib/dashboard/category-table'
import type {
  TableColumn,
  TableRow,
  TableSort,
} from '#/lib/dashboard/category-table'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { treeGuides } from '#/lib/shared/tree-layout'

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
            lowerIsBetter={kind === 'expense'}
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

function FiguresTable({
  columns,
  rows,
  open,
  markAbove,
  lowerIsBetter,
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
  lowerIsBetter: boolean
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
  const spans = changeSpans(columns)
  const compared = spans ? changeYear(spans) : null
  // Last year's line only on a year: on everything each bar is already a year.
  const lastYear = columns.some((c) => c.kind === 'thisYear') ? compared : null
  const shown = shownRows(rows, open.ids)
  const guides = treeGuides(shown.map(({ row }) => row.depth))
  return (
    <TableScroll>
      <table className="w-full min-w-[34rem] text-sm">
        <CategoryTableHead columns={columns} compared={compared} />
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
              change={{ shown: compared !== null, lowerIsBetter, lastYear }}
              currency={currency}
            />
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

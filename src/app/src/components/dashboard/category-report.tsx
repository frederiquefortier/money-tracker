import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryFilterSheet } from '#/components/dashboard/category-filter-sheet'
import { ChartLegendRow } from '#/components/dashboard/chart-parts'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { SplitDonut } from '#/components/dashboard/split-donut'
import type { Part } from '#/components/dashboard/split-donut'
import { StackedBars } from '#/components/dashboard/stacked-bars'
import { IconButton } from '#/components/display/icon-button'
import { EmptyState } from '#/components/lists/list-card'
import { TabList } from '#/components/lists/tab-list'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { Category, CategoryKind } from '#/lib/categories/category'
import { CHART_KINDS, SPLIT_VIEWS } from '#/lib/dashboard/category-stacks'
import type {
  CategoryStacks,
  ChartKind,
  SplitView,
} from '#/lib/dashboard/category-stacks'
import { oneOf } from '#/lib/shared/collections'

const parseChart = oneOf(CHART_KINDS)
const UNMARKED_COLOR = 'var(--muted-foreground)'

// Needs and wants are both spending: two shades of its red, so they never read as
// invested or what remains (author, 2026-11-19).
const NECESSITY_COLORS: Partial<Record<string, string>> = {
  need: 'var(--flow-spent)',
  want: 'color-mix(in oklch, var(--flow-spent) 50%, var(--card))',
  unclassified: 'color-mix(in oklch, var(--muted-foreground) 45%, var(--card))',
}

/** Each series named and coloured: its category, or a need or want mark. */
function useParts(stacks: CategoryStacks): Array<Part> {
  const { t } = useTranslation()
  return stacks.series.map(({ key, ...rest }) => {
    if (rest.category)
      return {
        key,
        ...rest,
        label: rest.category.name,
        color: rest.category.color,
      }
    return {
      key,
      ...rest,
      label: t(
        `dashboard.split.necessity.${key as 'need' | 'want' | 'unclassified'}`,
      ),
      color: NECESSITY_COLORS[key] ?? UNMARKED_COLOR,
    }
  })
}

/** Stacked by month or the whole as a donut (author, 2026-11-20). */
function ChartChoice({
  value,
  onChange,
}: {
  value: ChartKind
  onChange: (chart: ChartKind) => void
}) {
  const { t } = useTranslation()
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        const chart = parseChart(next)
        if (chart) onChange(chart)
      }}
      aria-label={t('dashboard.reports.chartLabel')}
      className="gap-0.5"
    >
      {CHART_KINDS.map((chart) => (
        <ToggleGroupItem key={chart} value={chart} className="px-2.5">
          {t(`dashboard.reports.charts.${chart}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** The period's total and the categories' filter. */
function ReportTotal({
  total,
  picked,
  currency,
  onFilter,
}: {
  total: string | null
  picked: number
  currency: string
  onFilter: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <span className="text-sm">
        <span className="text-muted-foreground">
          {t('dashboard.reports.total')}{' '}
        </span>
        <Figure amount={total} currency={currency} className="font-semibold" />
      </span>
      <IconButton
        icon="filter"
        label={
          picked
            ? t('dashboard.categories.filterCount', { count: picked })
            : t('dashboard.categories.filter')
        }
        pressed={picked > 0}
        onClick={onFilter}
      />
    </>
  )
}

function ReportChart({
  chart,
  parts,
  rows,
  current,
  currency,
}: {
  chart: ChartKind
  parts: ReadonlyArray<Part>
  rows: CategoryStacks['rows']
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  if (parts.length === 0) return <EmptyState>{t('dashboard.empty')}</EmptyState>
  if (chart === 'donut') return <SplitDonut parts={parts} currency={currency} />
  return (
    <>
      <StackedBars
        series={parts}
        rows={rows}
        current={current}
        currency={currency}
      />
      <ChartLegendRow series={parts} />
    </>
  )
}

/** Expenses only: by need and want, by group or by category. */
export type ViewChoice = {
  value: SplitView
  onChange: (view: SplitView) => void
}

/**
 * The income or expense card (DSH-02, DSH-07, DSH-09): the period's money split by group
 * (expenses also by need and want or by category), as each month stacked or as a donut of
 * the whole, with a filter on the categories and the period's total.
 */
export function CategoryReport({
  kind,
  stacks,
  categories,
  picked,
  onPick,
  chart,
  onChart,
  view,
  current,
  currency,
}: {
  kind: Extract<CategoryKind, 'income' | 'expense'>
  stacks: CategoryStacks
  categories: ReadonlyArray<Category>
  picked: ReadonlyArray<string>
  onPick: (ids: Array<string>) => void
  chart: ChartKind
  onChart: (chart: ChartKind) => void
  view?: ViewChoice
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const [filterOpen, setFilterOpen] = useState(false)
  const parts = useParts(stacks)
  const panel = `${kind}-report`
  return (
    <DashboardCard
      title={t(`dashboard.reports.${kind}`)}
      actions={
        <ReportTotal
          total={stacks.total}
          picked={picked.length}
          currency={currency}
          onFilter={() => setFilterOpen(true)}
        />
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {view && (
          <TabList
            label={t('dashboard.split.viewLabel')}
            tabs={SPLIT_VIEWS}
            value={view.value}
            labelOf={(v) => t(`dashboard.split.views.${v}`)}
            panelId={panel}
            idPrefix={`${kind}-view`}
            wrap
            onSelect={view.onChange}
          />
        )}
        <ChartChoice value={chart} onChange={onChart} />
      </div>
      <div
        id={panel}
        {...(view && {
          role: 'tabpanel',
          'aria-labelledby': `${kind}-view-${view.value}`,
        })}
        className="flex flex-col gap-4"
      >
        <ReportChart
          chart={chart}
          parts={parts}
          rows={stacks.rows}
          current={current}
          currency={currency}
        />
      </div>
      <CategoryFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        categories={categories.filter((c) => c.kind === kind)}
        picked={picked}
        onChange={onPick}
      />
    </DashboardCard>
  )
}

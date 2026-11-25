import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryFilterSheet } from '#/components/dashboard/category-filter-sheet'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { SplitDonut } from '#/components/dashboard/split-donut'
import type { Part } from '#/components/dashboard/split-donut'
import { StackedBars } from '#/components/dashboard/stacked-bars'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { IconToggle } from '#/components/display/icon-toggle'
import { FilterButton } from '#/components/lists/filter-button'
import { EmptyState } from '#/components/lists/list-card'
import type { Category, CategoryKind } from '#/lib/categories/category'
import { CHART_KINDS, SPLIT_VIEWS } from '#/lib/dashboard/category-stacks'
import type {
  CategoryStacks,
  ChartKind,
  SplitView,
} from '#/lib/dashboard/category-stacks'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { bucketSearch } from '#/lib/dashboard/drill-down'

const CHART_ICONS = { stack: 'chart-bar-stacked', donut: 'chart-pie' } as const
const UNMARKED_COLOR = 'var(--muted-foreground)'

// Needs and wants are both spending: two shades of its red, so they never read as
// invested or what remains.
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

/** Stacked by month or the whole as a donut, as two icons. */
function ChartChoice({
  value,
  onChange,
}: {
  value: ChartKind
  onChange: (chart: ChartKind) => void
}) {
  const { t } = useTranslation()
  return (
    <IconToggle
      label={t('dashboard.reports.chartLabel')}
      value={value}
      options={CHART_KINDS.map((chart) => ({
        value: chart,
        icon: CHART_ICONS[chart],
        label: t(`dashboard.reports.charts.${chart}`),
      }))}
      onChange={onChange}
    />
  )
}

/** Expenses' split as a menu, as the net worth list's grouping. */
function SplitChoice({ view }: { view: ViewChoice }) {
  const { t } = useTranslation()
  const labelOf = (v: SplitView) => t(`dashboard.split.views.${v}`)
  return (
    <ChoiceMenu
      label={t('dashboard.split.menuLabel', { view: labelOf(view.value) })}
      value={view.value}
      options={SPLIT_VIEWS}
      labelOf={labelOf}
      onChange={view.onChange}
    />
  )
}

/** The period's total, beside the title without a label. */
function ReportTotal({
  total,
  currency,
}: {
  total: string | null
  currency: string
}) {
  return (
    <Figure
      amount={total}
      currency={currency}
      className="text-sm font-semibold text-muted-foreground"
    />
  )
}

function ReportChart({
  chart,
  parts,
  rows,
  period,
  current,
  currency,
}: {
  chart: ChartKind
  parts: ReadonlyArray<Part>
  rows: CategoryStacks['rows']
  period: DashboardPeriod
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const categoryOf = (key: string) =>
    parts.find((p) => p.key === key)?.category?.id
  if (parts.length === 0) return <EmptyState>{t('dashboard.empty')}</EmptyState>
  if (chart === 'donut')
    return <SplitDonut parts={parts} period={period} currency={currency} />
  // No legend: the tooltip names each part.
  return (
    <StackedBars
      series={parts}
      rows={rows}
      current={current}
      currency={currency}
      canOpen={(key) => categoryOf(key) !== undefined}
      onOpen={(key, bucket) => {
        const id = categoryOf(key)
        if (id)
          void navigate({
            to: '/transactions',
            search: bucketSearch(period, bucket, [id]),
          })
      }}
    />
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
 * the whole, with a filter on the categories and the period's total. A part opens its
 * category's transactions.
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
  period,
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
  period: DashboardPeriod
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const [filterOpen, setFilterOpen] = useState(false)
  const parts = useParts(stacks)
  return (
    <DashboardCard
      title={t(`dashboard.reports.${kind}`)}
      note={<ReportTotal total={stacks.total} currency={currency} />}
      actions={
        <>
          {view && <SplitChoice view={view} />}
          <FilterButton
            count={picked.length}
            onOpen={() => setFilterOpen(true)}
          />
          <ChartChoice value={chart} onChange={onChart} />
        </>
      }
    >
      <ReportChart
        chart={chart}
        parts={parts}
        rows={stacks.rows}
        period={period}
        current={current}
        currency={currency}
      />
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

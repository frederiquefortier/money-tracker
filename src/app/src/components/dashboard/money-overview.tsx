import { CategoryReport } from '#/components/dashboard/category-report'
import { CategoryTableCard } from '#/components/dashboard/category-table-card'
import { CumulativeChart } from '#/components/dashboard/cumulative-chart'
import { FlowSummary } from '#/components/dashboard/flow-summary'
import { MerchantTableCard } from '#/components/dashboard/merchant-table-card'
import { MonthlyChart } from '#/components/dashboard/monthly-chart'
import { SpendingHeatmap } from '#/components/dashboard/spending-heatmap'
import { useDashboard } from '#/hooks/dashboard/use-dashboard'
import type { Dashboard } from '#/lib/dashboard/dashboard'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import type { DaySpent } from '#/lib/dashboard/daily-spending'

type Daily = { days: ReadonlyArray<DaySpent> | null; failed: boolean }
type State = ReturnType<typeof useDashboard>

/**
 * On a year, income and where it went beside the pace, then the months beside the days
 * (author, 2026-11-20); on everything, the years beside the summary. One column on a phone,
 * in that order.
 */
function FlowCards({
  state,
  period,
  today,
  daily,
  categoryIds,
  currency,
}: {
  state: State
  period: DashboardPeriod
  today: string
  daily: Daily
  categoryIds: { earned: Array<string>; spent: Array<string> }
  currency: string
}) {
  const { current } = state
  const monthly = (
    <MonthlyChart
      buckets={state.buckets}
      missing={state.missing}
      current={current}
      currency={currency}
      yearly={period.unit === 'all'}
      categoryIds={categoryIds}
      period={period}
    />
  )
  return (
    <>
      <FlowSummary
        flows={state.flows}
        before={state.compared}
        average={state.average}
        yearly={period.unit === 'all'}
        currency={currency}
      />
      {period.unit === 'all' ? (
        monthly
      ) : (
        <>
          <CumulativeChart
            points={state.cumulative}
            lastYear={state.lastYear}
            year={period.year}
            current={current}
            currency={currency}
          />
          {monthly}
          <SpendingHeatmap
            year={period.year}
            today={today}
            days={daily.days}
            failed={daily.failed}
            currency={currency}
          />
        </>
      )}
    </>
  )
}

/**
 * Expenses beside income, each stacked by month or as a donut (author, 2026-11-20), then
 * the categories' table and the merchants' across the page.
 */
function CategoryCards({
  state,
  dashboard,
  period,
  currency,
}: {
  state: State
  dashboard: Dashboard
  period: DashboardPeriod
  currency: string
}) {
  const { current } = state
  return (
    <>
      <CategoryReport
        kind="expense"
        stacks={state.expenses}
        categories={dashboard.categories}
        picked={state.expensePicked}
        onPick={state.setExpensePicked}
        chart={state.expenseChart}
        onChart={state.setExpenseChart}
        view={{ value: state.splitView, onChange: state.setSplitView }}
        period={period}
        current={current}
        currency={currency}
      />
      <CategoryReport
        kind="income"
        stacks={state.income}
        categories={dashboard.categories}
        picked={state.incomePicked}
        onPick={state.setIncomePicked}
        chart={state.incomeChart}
        onChart={state.setIncomeChart}
        period={period}
        current={current}
        currency={currency}
      />
      <div className="min-w-0 xl:col-span-2">
        <CategoryTableCard
          kind={state.tableKind}
          onKind={state.setTableKind}
          sort={state.tableSort}
          onSort={state.setTableSort}
          columns={state.tableColumns}
          rows={state.table}
          trendKeys={state.trendKeys}
          gaps={state.missing}
          period={period}
          current={current}
          currency={currency}
        />
      </div>
      <div className="min-w-0 xl:col-span-2">
        <MerchantTableCard
          rows={state.merchants}
          sort={state.merchantSort}
          onSort={state.setMerchantSort}
          columns={state.tableColumns}
          trendKeys={state.trendKeys}
          period={period}
          current={current}
          currency={currency}
        />
      </div>
    </>
  )
}

/**
 * The Argent tab, two cards side by side from `xl` (author, 2026-11-20), from the answer to
 * the detail: income and where it went, the pace, the months,
 * the days, expenses and income, then the table across. One column, in that order, below.
 */
export function MoneyOverview({
  dashboard,
  period,
  today,
  daily,
}: {
  dashboard: Dashboard
  period: DashboardPeriod
  today: string
  /** The heat map's days on a year: null while loading. */
  daily: Daily
}) {
  const state = useDashboard(dashboard, period, today)
  const currency = dashboard.displayCurrency
  const topOf = (kind: 'income' | 'expense') =>
    dashboard.categories
      .filter((c) => c.kind === kind && c.parentId === null)
      .map((c) => c.id)
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <FlowCards
        state={state}
        period={period}
        today={today}
        daily={daily}
        categoryIds={{ earned: topOf('income'), spent: topOf('expense') }}
        currency={currency}
      />
      <CategoryCards
        state={state}
        dashboard={dashboard}
        period={period}
        currency={currency}
      />
    </div>
  )
}

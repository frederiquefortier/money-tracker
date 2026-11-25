import { useMemo } from 'react'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import {
  KINDS,
  childrenByParent,
  descendantIds,
} from '#/lib/categories/category'
import type { Category, CategoryKind } from '#/lib/categories/category'
import {
  CHART_KINDS,
  SPLIT_VIEWS,
  categoryStacks,
} from '#/lib/dashboard/category-stacks'
import type { ChartKind, SplitView } from '#/lib/dashboard/category-stacks'
import {
  categoryTable,
  tableColumns,
  trendSpans,
} from '#/lib/dashboard/category-table'
import type { TableColumn } from '#/lib/dashboard/category-table'
import { TABLE_SORTS, sortTable } from '#/lib/dashboard/category-table-list'
import type { TableSort } from '#/lib/dashboard/category-table-list'
import {
  BILL_SORTS,
  merchantBills,
  sortBills,
} from '#/lib/dashboard/merchant-bills'
import type { BillSort } from '#/lib/dashboard/merchant-bills'
import { missingMonths } from '#/lib/dashboard/missing-months'
import type { Dashboard } from '#/lib/dashboard/dashboard'
import { bucketsOf } from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import {
  averageFlows,
  bucketFlows,
  comparedFlows,
  cumulative,
  periodFlows,
} from '#/lib/dashboard/money-flows'
import { oneOf } from '#/lib/shared/collections'

const parseKind = oneOf(KINDS)
const parseView = oneOf(SPLIT_VIEWS)
const parseChart = oneOf(CHART_KINDS)
const parseSort = oneOf(TABLE_SORTS)
const parseMerchantSort = oneOf(BILL_SORTS)
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/** The ticked categories with their branches; null when none is ticked. */
function branchOf(
  picked: ReadonlyArray<string>,
  categories: ReadonlyArray<Category>,
  locale: string,
): Set<string> | null {
  const known = picked.filter((id) => categories.some((c) => c.id === id))
  if (known.length === 0) return null
  const children = childrenByParent(categories, locale)
  return new Set(known.flatMap((id) => [id, ...descendantIds(id, children)]))
}

/** The filters and views of the Argent tab, remembered per browser. */
function useDashboardChoices() {
  const [incomePicked, setIncomePicked] = useStoredState<Array<string>>(
    'dashboard.incomeCategories',
    [],
    parseIds,
  )
  const [expensePicked, setExpensePicked] = useStoredState<Array<string>>(
    'dashboard.expenseCategories',
    [],
    parseIds,
  )
  const [splitView, setSplitView] = useStoredState<SplitView>(
    'dashboard.splitView',
    'necessity',
    parseView,
  )
  const [expenseChart, setExpenseChart] = useStoredState<ChartKind>(
    'dashboard.expenseChart',
    'stack',
    parseChart,
  )
  const [incomeChart, setIncomeChart] = useStoredState<ChartKind>(
    'dashboard.incomeChart',
    'stack',
    parseChart,
  )
  const [tableKind, setTableKind] = useStoredState<CategoryKind>(
    'dashboard.tableKind',
    'expense',
    parseKind,
  )
  const [tableSort, setTableSort] = useStoredState<TableSort>(
    'dashboard.tableSort',
    'nameAsc',
    parseSort,
  )
  const [merchantSort, setMerchantSort] = useStoredState<BillSort>(
    'dashboard.merchantSort',
    'amountDesc',
    parseMerchantSort,
  )
  return {
    merchantSort,
    setMerchantSort,
    tableSort,
    setTableSort,
    incomePicked,
    setIncomePicked,
    expensePicked,
    setExpensePicked,
    splitView,
    setSplitView,
    expenseChart,
    setExpenseChart,
    incomeChart,
    setIncomeChart,
    tableKind,
    setTableKind,
  }
}

/** The merchants' rows over the table's stretch, apart so a sort recounts nothing else. */
function useMerchants(
  data: Dashboard,
  columns: ReadonlyArray<TableColumn>,
  sort: BillSort,
) {
  const locale = useFormatLocale()
  const rows = useMemo(
    () => merchantBills(data.merchantMonths, data.merchants, columns),
    [data, columns],
  )
  return useMemo(() => sortBills(rows, sort, locale), [rows, sort, locale])
}

/** The Argent tab's figures for the period. */
export function useDashboard(
  data: Dashboard,
  period: DashboardPeriod,
  today: string,
) {
  const locale = useFormatLocale()
  const choices = useDashboardChoices()
  const {
    incomePicked,
    expensePicked,
    splitView,
    tableKind,
    tableSort,
    merchantSort,
  } = choices

  const figures = useMemo(() => {
    const { months, categories } = data
    const buckets = bucketsOf(period, data.firstYear, today)
    const firstMonth = months[0]?.month ?? today.slice(0, 7)
    const columns = tableColumns(period, {
      today,
      firstYear: data.firstYear,
      firstMonth,
    })
    const lastYear = String(Number(period.year) - 1)
    const flows = periodFlows(months, categories, period)
    // Over the same months (or years) as the table's average column.
    const count =
      columns.find((c) => c.kind === 'averageMonth' || c.kind === 'averageYear')
        ?.divisor ?? 1
    return {
      flows,
      average: { flows: averageFlows(flows, count), count },
      compared: comparedFlows(months, categories, { period, today }),
      lastYear:
        Number(lastYear) < data.firstYear
          ? null
          : cumulative(months, categories, {
              period: { unit: 'year', year: lastYear },
              firstMonth,
              today,
            }),
      missing: missingMonths(months, period, { firstMonth, today }),
      trendKeys: trendSpans(columns).map((s) => s.key),
      buckets: bucketFlows(months, categories, { period, buckets }),
      cumulative: cumulative(months, categories, { period, firstMonth, today }),
      income: categoryStacks(months, categories, {
        period,
        buckets,
        kind: 'income',
        picked: branchOf(incomePicked, categories, locale),
      }),
      expenses: categoryStacks(months, categories, {
        period,
        buckets,
        kind: 'expense',
        picked: branchOf(expensePicked, categories, locale),
        view: splitView,
      }),
      tableColumns: columns,
      table: sortTable(
        categoryTable(months, categories, { kind: tableKind, columns, locale }),
        tableSort,
        locale,
      ),
    }
  }, [
    data,
    period,
    today,
    incomePicked,
    expensePicked,
    splitView,
    tableKind,
    tableSort,
    locale,
  ])
  const merchants = useMerchants(data, figures.tableColumns, merchantSort)

  // The bucket not over yet: this month on a year, this year on everything.
  const current = period.unit === 'year' ? today.slice(0, 7) : today.slice(0, 4)
  return { ...figures, merchants, ...choices, current }
}

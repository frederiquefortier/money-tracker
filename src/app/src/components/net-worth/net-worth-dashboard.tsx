import { HideItemsSheet } from '#/components/net-worth/hide-items-sheet'
import { NetWorthCard } from '#/components/net-worth/net-worth-card'
import { RangeTabs } from '#/components/net-worth/range-tabs'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { ChartItem } from '#/lib/net-worth/net-worth-series'

/**
 * The hub under its title: the range tabs first, since every figure below is measured
 * over the range. From `xl`, the net worth card on the left and the list on the right,
 * half the page each, the list's controls on the tabs' row (author, 2026-11-18).
 * Narrower, one column at the width of every list page: the net worth, the list's
 * controls, the list.
 */
export function NetWorthDashboard({
  chart,
  total,
  currency,
  converted,
  items,
  controls,
  list,
}: {
  chart: NetWorthChartState
  total: string | null
  currency: string
  converted: boolean
  items: ReadonlyArray<ChartItem>
  /** Expand all, the grouping and the sort: they act on the list only. */
  controls: React.ReactNode
  /** Every account and holding (ItemList). */
  list: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 xl:grid xl:grid-cols-12 xl:items-start">
      {chart.totals.length > 1 && (
        <div className="xl:col-span-6 xl:row-start-1">
          <RangeTabs range={chart.range} onChange={chart.setRange} />
        </div>
      )}
      {/* Over the list: on the tabs' row from `xl` (author, 2026-11-18), under the card
          below it. */}
      <div className="order-1 mt-3 flex flex-wrap items-center justify-end gap-2 xl:order-none xl:col-span-6 xl:col-start-7 xl:row-start-1 xl:mt-0">
        {controls}
      </div>
      <div className="min-w-0 xl:col-span-6 xl:row-start-2">
        <NetWorthCard
          chart={chart}
          total={total}
          currency={currency}
          converted={converted}
        />
      </div>
      <div className="order-2 min-w-0 xl:order-none xl:col-span-6 xl:col-start-7 xl:row-start-2">
        {list}
      </div>
      <HideItemsSheet chart={chart} items={items} />
    </div>
  )
}

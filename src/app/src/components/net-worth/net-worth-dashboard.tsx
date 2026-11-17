import { CompositionCard } from '#/components/net-worth/composition-card'
import { HideItemsSheet } from '#/components/net-worth/hide-items-sheet'
import { ItemList } from '#/components/net-worth/item-list'
import { NetWorthCard } from '#/components/net-worth/net-worth-card'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { ChartItem } from '#/lib/net-worth/net-worth-series'

/**
 * The hub under its title. From `lg`, the net worth card and the item list on the left
 * (eight of twelve columns), the composition and the subpage links sticky on the right.
 * On phones: the net worth, the composition and links, then the items.
 */
export function NetWorthDashboard({
  chart,
  total,
  currency,
  converted,
  items,
  links,
}: {
  chart: NetWorthChartState
  total: string | null
  currency: string
  converted: boolean
  items: ReadonlyArray<ChartItem>
  /** The Comptes and Avoirs cards. */
  links: React.ReactNode
}) {
  return (
    <div className="grid items-start gap-3 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-8">
        <NetWorthCard
          chart={chart}
          total={total}
          currency={currency}
          converted={converted}
        />
      </div>
      <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
        <CompositionCard chart={chart} currency={currency} />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">{links}</div>
      </div>
      <div className="min-w-0 lg:col-span-8">
        <ItemList chart={chart} currency={currency} />
      </div>
      <HideItemsSheet chart={chart} items={items} />
    </div>
  )
}

import { DrawerHeader } from '#/components/institutions/drawer-header'
import { HoldingRow } from '#/components/holdings/list/holding-row'
import { MissingRate, Money } from '#/components/display/money'
import { cardSurface } from '#/components/styles'
import { summarizeHoldings } from '#/lib/net-worth/net-worth'
import type { HoldingDrawer } from '#/lib/holdings/holding'

/** An institution's drawer of holdings, with their total in the display currency. */
export function HoldingGroup({
  drawer,
  name,
  displayCurrency,
  collapsed,
  onToggle,
}: {
  drawer: HoldingDrawer
  name: string
  displayCurrency: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { total } = summarizeHoldings(
    drawer.holdings.map((h) => ({
      kind: h.kind,
      latestOn: h.latestOn,
      displayValue: h.displayValue,
    })),
  )
  const converted = drawer.holdings.some((h) => h.currency !== displayCurrency)
  return (
    <section className={cardSurface}>
      <DrawerHeader
        institution={drawer.institution}
        name={name}
        collapsed={collapsed}
        onToggle={onToggle}
      >
        {total === null ? (
          <MissingRate />
        ) : (
          <Money
            amount={total}
            currency={displayCurrency}
            converted={converted}
            className="text-lg font-semibold"
          />
        )}
      </DrawerHeader>
      {!collapsed && (
        <ul className="divide-y border-t">
          {drawer.holdings.map((holding) => (
            <HoldingRow key={holding.id} holding={holding} />
          ))}
        </ul>
      )}
    </section>
  )
}

import { useTranslation } from 'react-i18next'
import { HoldingRow } from '#/components/holdings/list/holding-row'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { ListCard } from '#/components/lists/list-card'
import type { HoldingKind, ListedHolding } from '#/lib/holdings/holding'

/** The open holdings of one kind: a collapsible heading over one card. */
export function HoldingGroup({
  kind,
  holdings,
  collapsed,
  onToggle,
}: {
  kind: HoldingKind
  holdings: ReadonlyArray<ListedHolding>
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <CollapseToggle
        expanded={!collapsed}
        onToggle={onToggle}
        className="self-start font-bold"
      >
        {t(`holdings.kinds.${kind}`)}
      </CollapseToggle>
      {!collapsed && (
        <ListCard>
          {holdings.map((holding) => (
            <HoldingRow key={holding.id} holding={holding} />
          ))}
        </ListCard>
      )}
    </section>
  )
}

import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { ListCard } from '#/components/lists/list-card'
import { useStoredState } from '#/hooks/app/use-stored-state'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

/** Archived or past rows, collapsed under a list, flat and muted (PPL-02, EVT-02). */
export function CollapsedSection({
  label,
  storageKey,
  children,
}: {
  label: string
  storageKey: string
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useStoredState(
    storageKey,
    false,
    parseBoolean,
  )
  return (
    <section className="flex flex-col gap-2">
      <CollapseToggle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="self-start text-sm font-semibold text-muted-foreground"
      >
        {label}
      </CollapseToggle>
      {expanded && (
        <ListCard className="text-muted-foreground">{children}</ListCard>
      )}
    </section>
  )
}

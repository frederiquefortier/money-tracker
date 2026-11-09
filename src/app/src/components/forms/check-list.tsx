import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { cn } from '#/lib/utils'
import { fieldCard, focusRing } from '#/components/styles'

export type CheckNode = {
  id: string
  label: string
  icon?: React.ReactNode
  /** A second, muted line under the label (a transaction's date). */
  detail?: string
  /** Before the box, on the right (a transaction's amount). */
  aside?: React.ReactNode
  children?: Array<CheckNode>
}

/**
 * How a node reads: ticked, not, partly (some of its children), or ticked through a
 * ticked parent, which greys it out but still answers a tap.
 */
export type CheckState = 'on' | 'off' | 'mixed' | 'implied'

type Ticks = {
  stateOf: (node: CheckNode) => CheckState
  onToggle: (node: CheckNode) => void
}

function flatten(nodes: ReadonlyArray<CheckNode>): Array<CheckNode> {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])])
}

/** A whole row is the tap target, 48px tall, the box at its end. */
function CheckRow({
  node,
  state,
  onToggle,
}: {
  node: CheckNode
  state: CheckState
  onToggle: () => void
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 hover:bg-secondary/50 hover:[--row-bg:color-mix(in_oklab,var(--secondary)_50%,var(--card))]">
      {node.icon}
      <span
        className={cn(
          'flex min-w-0 flex-1 flex-col py-2',
          state === 'implied' && 'text-muted-foreground',
        )}
      >
        <span className="truncate font-medium">{node.label}</span>
        {node.detail && (
          // Relative, so it stays a step under the label at either size.
          <span className="truncate text-[0.875em] text-muted-foreground">
            {node.detail}
          </span>
        )}
      </span>
      {node.aside}
      <Checkbox
        checked={state === 'on' || state === 'implied'}
        indeterminate={state === 'mixed'}
        className={cn(state === 'implied' && 'opacity-50')}
        onChange={onToggle}
      />
    </label>
  )
}

/** Rows in a card; a node's children hang under it on the tree's line. */
function CheckRows({
  nodes,
  ticks,
}: {
  nodes: ReadonlyArray<CheckNode>
  ticks: Ticks
}) {
  return (
    <ul className="divide-y">
      {nodes.map((node) => (
        <li key={node.id}>
          <CheckRow
            node={node}
            state={ticks.stateOf(node)}
            onToggle={() => ticks.onToggle(node)}
          />
          {node.children && (
            <div className="ml-6 border-t border-l-2 border-l-primary/30">
              <CheckRows nodes={node.children} ticks={ticks} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * A group's card (an institution, a category type): its name folds it and shows how many
 * are ticked inside; Tout ticks all of it, Aucun once it is.
 */
function GroupCard({
  group,
  ticks,
  defaultOpen,
}: {
  group: CheckNode
  ticks: Ticks
  defaultOpen: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  const all = ticks.stateOf(group) === 'on'
  const ticked = flatten(group.children ?? []).filter(
    (node) => ticks.stateOf(node) === 'on',
  ).length
  return (
    <section className={fieldCard}>
      <header className="flex items-center gap-2 pr-2">
        <button
          type="button"
          aria-expanded={open}
          aria-label={t(open ? 'common.collapseName' : 'common.expandName', {
            name: group.label,
          })}
          onClick={() => setOpen(!open)}
          className={cn(
            'flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg pl-3 text-left',
            focusRing,
          )}
        >
          <Icon
            name="chevron-down"
            className={cn(
              'size-5 shrink-0 transition-transform',
              !open && '-rotate-90',
            )}
          />
          <span className="truncate font-bold">{group.label}</span>
          {ticked > 0 && (
            <span className="font-semibold text-primary">{ticked}</span>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t(
            all ? 'transactions.list.noneIn' : 'transactions.list.allIn',
            { name: group.label },
          )}
          onClick={() => ticks.onToggle(group)}
        >
          {t(all ? 'transactions.list.none' : 'transactions.list.all')}
        </Button>
      </header>
      {open && (
        <div className="border-t">
          <CheckRows nodes={group.children ?? []} ticks={ticks} />
        </div>
      )}
    </section>
  )
}

/**
 * One filter's list: groups as cards that fold, the first `openCount` open, or plain
 * rows in one card (merchants, a search's matches).
 */
export function CheckList({
  nodes,
  openCount = 0,
  small = false,
  stateOf,
  onToggle,
  children,
}: {
  nodes: ReadonlyArray<CheckNode>
  openCount?: number
  /** Rows at a field's text size, in a form (an income's Rembourse). */
  small?: boolean
  children?: React.ReactNode
} & Ticks) {
  if (nodes.length === 0 && !children) return null
  const ticks = { stateOf, onToggle }
  if (nodes.length > 0 && nodes.every((n) => n.children !== undefined))
    return (
      <div className="flex flex-col gap-2">
        {nodes.map((group, i) => (
          <GroupCard
            key={group.id}
            group={group}
            ticks={ticks}
            defaultOpen={i < openCount}
          />
        ))}
      </div>
    )
  return (
    <div className={cn(fieldCard, small && 'text-sm')}>
      {nodes.length > 0 && <CheckRows nodes={nodes} ticks={ticks} />}
      {children}
    </div>
  )
}

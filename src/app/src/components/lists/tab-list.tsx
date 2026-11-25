import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

const STEPS: Partial<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

type TabListProps<TTab extends string> = {
  label: string
  tabs: ReadonlyArray<TTab>
  value: TTab
  labelOf: (tab: TTab) => string
  panelId: string
  idPrefix: string
  disabled?: boolean
  /** Each tab sized to its label, for labels of very different lengths. */
  fit?: boolean
  /** A colour dot in place of the label, which stays the tab's name and title. */
  dot?: (tab: TTab) => string
  onSelect: (tab: TTab) => void
}

/**
 * A row of tabs over one panel (`panelId`); arrows move between them. Each tab's id is
 * `{idPrefix}-{tab}`, for the panel's aria-labelledby.
 */
export function TabList<TTab extends string>({
  label,
  tabs,
  value,
  labelOf,
  panelId,
  idPrefix,
  disabled = false,
  fit = false,
  dot,
  onSelect,
}: TabListProps<TTab>) {
  const idOf = (tab: TTab) => `${idPrefix}-${tab}`
  function onKeyDown(event: React.KeyboardEvent) {
    const step = STEPS[event.key]
    if (!step) return
    const next = tabs[(tabs.indexOf(value) + step + tabs.length) % tabs.length]
    onSelect(next)
    document.getElementById(idOf(next))?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        'grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-secondary p-1',
        fit && 'auto-cols-auto',
        disabled && 'opacity-50',
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          id={idOf(tab)}
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-controls={panelId}
          tabIndex={tab === value ? 0 : -1}
          disabled={disabled}
          onClick={() => onSelect(tab)}
          {...(dot && { 'aria-label': labelOf(tab), title: labelOf(tab) })}
          className={cn(
            'rounded-lg px-2 py-1.5 text-sm font-semibold',
            fit && 'whitespace-nowrap',
            tab === value
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'cursor-not-allowed hover:text-muted-foreground',
            focusRing,
          )}
        >
          {dot ? (
            <span
              aria-hidden="true"
              className="mx-1 inline-block size-2.5 rounded-full align-middle"
              style={{ backgroundColor: dot(tab) }}
            />
          ) : (
            labelOf(tab)
          )}
        </button>
      ))}
    </div>
  )
}

export function TabPanel({
  id,
  idPrefix,
  tab,
  className = 'flex flex-col gap-4',
  children,
}: {
  id: string
  idPrefix: string
  tab: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-${tab}`}
      className={className}
    >
      {children}
    </div>
  )
}

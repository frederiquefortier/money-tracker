import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

/**
 * A row of tabs over one panel (`panelId`); arrows move between them. Each tab's id is
 * `{idPrefix}-{tab}`, for the panel's aria-labelledby. A `muted` tab looks unavailable but
 * still answers, so the caller can say why. `disabled` turns the whole row off. `fit`
 * sizes each tab to its label, for labels of very different lengths in a narrow row.
 */
export function TabList<TTab extends string>({
  label,
  tabs,
  value,
  labelOf,
  panelId,
  idPrefix,
  muted,
  disabled = false,
  fit = false,
  onSelect,
}: {
  label: string
  tabs: ReadonlyArray<TTab>
  value: TTab
  labelOf: (tab: TTab) => string
  panelId: string
  idPrefix: string
  muted?: (tab: TTab) => boolean
  disabled?: boolean
  fit?: boolean
  onSelect: (tab: TTab) => void
}) {
  const idOf = (tab: TTab) => `${idPrefix}-${tab}`

  function onKeyDown(event: React.KeyboardEvent) {
    const steps: Partial<Record<string, number>> = {
      ArrowRight: 1,
      ArrowLeft: -1,
    }
    const step = steps[event.key]
    if (!step) return
    const next = tabs[(tabs.indexOf(value) + step + tabs.length) % tabs.length]
    if (muted?.(next)) return
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
        'grid grid-flow-col gap-1 rounded-xl bg-secondary p-1',
        fit ? 'auto-cols-auto' : 'auto-cols-fr',
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
          aria-disabled={muted?.(tab) || undefined}
          tabIndex={tab === value ? 0 : -1}
          disabled={disabled}
          onClick={() => onSelect(tab)}
          className={cn(
            'rounded-lg px-2 py-1.5 text-sm font-semibold',
            fit && 'whitespace-nowrap',
            tab === value
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            muted?.(tab) &&
              'cursor-default opacity-50 hover:text-muted-foreground',
            disabled && 'cursor-not-allowed hover:text-muted-foreground',
            focusRing,
          )}
        >
          {labelOf(tab)}
        </button>
      ))}
    </div>
  )
}

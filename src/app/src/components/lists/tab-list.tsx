import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

const STEPS: Partial<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 }

function TabCount({ n }: { n: number }) {
  if (n === 0) return null
  return (
    <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
      {n}
    </span>
  )
}

type TabListProps<TTab extends string> = {
  label: string
  tabs: ReadonlyArray<TTab>
  value: TTab
  labelOf: (tab: TTab) => string
  panelId: string
  idPrefix: string
  muted?: (tab: TTab) => boolean
  disabled?: boolean
  fit?: boolean
  wrap?: boolean
  count?: (tab: TTab) => number
  dot?: (tab: TTab) => string
  onSelect: (tab: TTab) => void
}

/**
 * A row of tabs over one panel (`panelId`); arrows move between them. Each tab's id is
 * `{idPrefix}-{tab}`, for the panel's aria-labelledby. A `muted` tab looks unavailable but
 * still answers, so the caller can say why. `disabled` turns the whole row off. `fit`
 * sizes each tab to its label, for labels of very different lengths in a narrow row.
 * `wrap` lets the tabs fall onto more lines instead of squeezing. `count` shows a number
 * after a tab's label while it is above zero. `dot` shows a colour dot in place of the label, which stays the tab's name and
 * title.
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
  wrap = false,
  count,
  dot,
  onSelect,
}: TabListProps<TTab>) {
  const idOf = (tab: TTab) => `${idPrefix}-${tab}`
  function onKeyDown(event: React.KeyboardEvent) {
    const step = STEPS[event.key]
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
        'gap-1 rounded-xl bg-secondary p-1',
        wrap ? 'flex flex-wrap' : 'grid auto-cols-fr grid-flow-col',
        fit && !wrap && 'auto-cols-auto',
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
          {...(dot && { 'aria-label': labelOf(tab), title: labelOf(tab) })}
          className={cn(
            'rounded-lg px-2 py-1.5 text-sm font-semibold',
            wrap && 'flex-1',
            (fit || wrap) && 'whitespace-nowrap',
            tab === value
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            muted?.(tab) &&
              'cursor-default opacity-50 hover:text-muted-foreground',
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
          <TabCount n={count?.(tab) ?? 0} />
        </button>
      ))}
    </div>
  )
}

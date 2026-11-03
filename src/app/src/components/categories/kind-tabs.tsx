import { useTranslation } from 'react-i18next'
import { KINDS } from '#/lib/categories'
import type { Kind } from '#/lib/categories'
import { cn, focusRing } from '#/lib/utils'

/** CAT-02: one tab per kind. The list below is the panel; arrows move between tabs. */
export function KindTabs({
  kind,
  panelId,
  onChange,
}: {
  kind: Kind
  panelId: string
  onChange: (kind: Kind) => void
}) {
  const { t } = useTranslation()

  function onKeyDown(event: React.KeyboardEvent) {
    const steps: Partial<Record<string, number>> = {
      ArrowRight: 1,
      ArrowLeft: -1,
    }
    const step = steps[event.key]
    if (!step) return
    const next =
      KINDS[(KINDS.indexOf(kind) + step + KINDS.length) % KINDS.length]
    onChange(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={t('categories.kindsLabel')}
      onKeyDown={onKeyDown}
      className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1"
    >
      {KINDS.map((k) => (
        <button
          key={k}
          id={`tab-${k}`}
          type="button"
          role="tab"
          aria-selected={k === kind}
          aria-controls={panelId}
          tabIndex={k === kind ? 0 : -1}
          onClick={() => onChange(k)}
          className={cn(
            'rounded-lg px-2 py-1.5 text-sm font-semibold',
            k === kind
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            focusRing,
          )}
        >
          {t(`categories.kinds.${k}`)}
        </button>
      ))}
    </div>
  )
}

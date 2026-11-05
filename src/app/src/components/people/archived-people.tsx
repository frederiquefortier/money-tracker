import { useTranslation } from 'react-i18next'
import { CollapseToggle } from '#/components/collapse-toggle'
import { ListCard } from '#/components/list-card'
import { formatDate } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

/** PPL-02: archived people or groups, collapsed under the list, flat and muted. */
export function ArchivedPeople({
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

export function ArchivedOn({ date }: { date: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <span className="text-sm whitespace-nowrap">
      {t('people.archivedOn', { date: formatDate(date, locale, 'medium') })}
    </span>
  )
}

import { useTranslation } from 'react-i18next'
import { HoldingRow } from '#/components/holdings/list/holding-row'
import { CollapseToggle } from '#/components/lists/collapse-toggle'
import { ListCard } from '#/components/lists/list-card'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import type { ListedHolding } from '#/lib/holdings/holding'

const parseBoolean = (v: unknown) => (typeof v === 'boolean' ? v : undefined)

/** Archived holdings, flat and muted, with their closing date. */
export function ClosedHoldings({
  holdings,
}: {
  holdings: ReadonlyArray<ListedHolding>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [expanded, setExpanded] = useStoredState(
    'holdings.closedExpanded',
    false,
    parseBoolean,
  )
  if (holdings.length === 0) return null

  return (
    <section className="mt-2 flex flex-col gap-2 border-t pt-4">
      <CollapseToggle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="self-start text-sm font-semibold text-muted-foreground"
      >
        {t('holdings.closed', { count: holdings.length })}
      </CollapseToggle>
      {expanded && (
        <ListCard className="text-muted-foreground">
          {holdings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              alignTop
              aside={
                holding.closedOn && (
                  <span className="text-sm leading-6 whitespace-nowrap">
                    {t('holdings.closedOn', {
                      date: formatDate(holding.closedOn, locale, 'medium'),
                    })}
                  </span>
                )
              }
            />
          ))}
        </ListCard>
      )}
    </section>
  )
}

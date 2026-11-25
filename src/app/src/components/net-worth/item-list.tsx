import { useTranslation } from 'react-i18next'
import { IconAnchor } from '#/components/display/icon-button'
import { MissingRate, Money } from '#/components/display/money'
import { GROUP_COLORS } from '#/components/net-worth/chart-lines'
import { ItemRow } from '#/components/net-worth/item-row'
import { OwedMoney } from '#/components/net-worth/owed-money'
import { CollapsedSection } from '#/components/lists/collapsed-section'
import { DrawerHeader } from '#/components/lists/drawer-header'
import { EmptyState } from '#/components/lists/list-card'
import { cardSurface } from '#/components/styles'
import { Revealed } from '#/components/lists/revealed'
import { useLocale } from '#/hooks/app/use-locale'
import { closedEntries, groupWorth } from '#/lib/net-worth/net-worth-list'
import { negateDecimal } from '#/lib/shared/money'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { EntryGroup, NetWorthEntry } from '#/lib/net-worth/net-worth-list'

/** What the group adds today, without the hidden items; the debts as owed. */
function Subtotal({
  group,
  hidden,
  currency,
}: {
  group: EntryGroup
  hidden: ReadonlySet<string>
  currency: string
}) {
  const worth = groupWorth(group.entries, hidden)
  if (worth === null) return <MissingRate />
  const converted = group.entries.some((e) => e.currency !== currency)
  if (group.by === 'type' && group.group === 'debts')
    return (
      <OwedMoney
        owed={negateDecimal(worth)}
        currency={currency}
        converted={converted}
        whole
        className="text-lg font-semibold"
      />
    )
  // A group's total without cents, as the dashboard's totals; its
  // items keep theirs.
  return (
    <Money
      amount={worth}
      currency={currency}
      converted={converted}
      whole
      className="text-lg font-semibold"
    />
  )
}

function Group({
  group,
  chart,
  currency,
  collapsed,
  onToggle,
}: {
  group: EntryGroup
  chart: NetWorthChartState
  currency: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const byType = group.by === 'type'
  const name = byType
    ? t(`netWorth.chart.groups.${group.group}`)
    : (group.institution?.name ?? t('accounts.noInstitution'))
  const website = byType ? null : group.institution?.websiteUrl
  return (
    <section className={cardSurface}>
      <DrawerHeader
        name={name}
        color={byType ? GROUP_COLORS[group.group] : undefined}
        collapsed={collapsed}
        onToggle={onToggle}
        after={
          website && (
            <IconAnchor
              icon="external-link"
              label={t('institutions.openWebsite', { name })}
              href={website}
            />
          )
        }
        total={
          <Subtotal
            group={group}
            hidden={chart.excluded.ids}
            currency={currency}
          />
        }
      />
      {!collapsed && (
        <ul className="divide-y border-t">
          <Revealed items={group.entries}>
            {(shown) =>
              shown.map((entry) => (
                <ItemRow
                  key={entry.id}
                  entry={entry}
                  label={byType ? entry.label : entry.shortLabel}
                  chart={chart}
                  currency={currency}
                />
              ))
            }
          </Revealed>
        </ul>
      )}
    </section>
  )
}

function Archived({
  entries,
  chart,
  currency,
}: {
  entries: ReadonlyArray<NetWorthEntry>
  chart: NetWorthChartState
  currency: string
}) {
  const { t } = useTranslation()
  if (entries.length === 0) return null
  return (
    <CollapsedSection
      label={t('netWorth.closed', { count: entries.length })}
      storageKey="netWorth.closedExpanded"
    >
      {entries.map((entry) => (
        <ItemRow
          key={entry.id}
          entry={entry}
          label={entry.label}
          chart={chart}
          currency={currency}
        />
      ))}
    </CollapsedSection>
  )
}

/**
 * Every account and holding (spec 20, ADR-061), in groups by type or by institution, each
 * a card with its header inside, and what it adds to the net worth at the far right. A row opens the
 * item's form; its line opens its chart at its own scale.
 * Hidden items stay listed, marked, and leave the totals (NW-05). The archived ones last,
 * muted, with their line and chart over their whole history.
 */
export function ItemList({
  entries,
  groups,
  chart,
  currency,
  collapsed,
  onToggle,
}: {
  entries: ReadonlyArray<NetWorthEntry>
  groups: ReadonlyArray<EntryGroup>
  chart: NetWorthChartState
  currency: string
  collapsed: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <div className="flex flex-col gap-4">
      {groups.length === 0 && <EmptyState>{t('netWorth.empty')}</EmptyState>}
      {groups.map((group) => (
        <Group
          key={`${group.by}:${group.key}`}
          group={group}
          chart={chart}
          currency={currency}
          collapsed={collapsed.has(group.key)}
          onToggle={() => onToggle(group.key)}
        />
      ))}
      <Archived
        entries={closedEntries(entries, locale)}
        chart={chart}
        currency={currency}
      />
    </div>
  )
}

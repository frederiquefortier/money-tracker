import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { EventBadge } from '#/components/events/event-badge'
import type { CheckNode } from '#/components/forms/check-list'
import { GROUP } from '#/components/forms/check-ticks'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { accountLabel } from '#/lib/accounts/account'
import { KINDS, categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { isPast, sortEvents } from '#/lib/events/event'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Person, PersonGroup } from '#/lib/people/person'
import type { FormAccount } from '#/lib/transactions/transaction'
import { treeOrder } from '#/lib/shared/tree-layout'
import { byName, indexById } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'

// The trees the check lists show: accounts, people and categories as nodes.

/** Accounts under their institution: ticking one ticks all its accounts. */
export function useAccountTree(
  accounts: ReadonlyArray<FormAccount>,
  query: string,
) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const matches = matcher(query)
  const sorted = byName(accounts, locale)
  if (query.trim())
    return sorted
      .filter((a) => matches(accountLabel(a)))
      .map((a) => ({ id: a.id, label: accountLabel(a) }))
  const groups = new Map<string, Array<CheckNode>>()
  for (const a of sorted) {
    const name = a.institution ?? t('transactions.noInstitution')
    groups.set(name, [...(groups.get(name) ?? []), { id: a.id, label: a.name }])
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b, locale))
    .map(([name, children]) => ({
      id: `${GROUP}${name}`,
      label: name,
      children,
    }))
}

/**
 * People under their groups, as accounts under their institution: a person in
 * several groups is in each, those in none under "Sans groupe". Searching lists the
 * matches flat, by name or alias. Archived people stay, for past transactions.
 */
export function usePeopleTree(
  people: ReadonlyArray<Person>,
  groups: ReadonlyArray<PersonGroup>,
  query: string,
): Array<CheckNode> {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const matches = matcher(query)
  const sorted = byName(people, locale)
  const leaf = (p: Person) => ({ id: p.id, label: p.name })
  if (query.trim() || groups.length === 0)
    return sorted.filter((p) => [p.name, ...p.aliases].some(matches)).map(leaf)
  const cards = byName(groups, locale)
    .map((g) => ({
      id: `${GROUP}${g.id}`,
      label: g.name,
      children: sorted.filter((p) => g.memberIds.includes(p.id)).map(leaf),
    }))
    .filter((card) => card.children.length > 0)
  const alone = sorted.filter((p) => p.groupIds.length === 0).map(leaf)
  return alone.length
    ? [
        ...cards,
        {
          id: `${GROUP}none`,
          label: t('transactions.list.noGroup'),
          children: alone,
        },
      ]
    : cards
}

/** The Catégories tree under its types; a search lists the matches by full path. */
export function useCategoryTree(
  categories: ReadonlyArray<Category>,
  query: string,
) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const byId = indexById(categories)
  const matches = matcher(query)
  const icon = (c: Category) => (
    <CategoryBadge icon={c.icon} color={c.color} size="sm" />
  )
  if (query.trim())
    return categories
      .map((c) => ({ id: c.id, label: categoryPath(c, byId), icon: icon(c) }))
      .filter((n) => matches(n.label))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  const nodeOf = (c: Category): CheckNode => {
    const children = categories.filter((k) => k.parentId === c.id)
    return {
      id: c.id,
      label: c.name,
      icon: icon(c),
      children: children.length
        ? treeOrder(children, locale)
            .filter(({ depth }) => depth === 0)
            .map(({ item }) => nodeOf(item))
        : undefined,
    }
  }
  return KINDS.flatMap((kind) => {
    const tops = treeOrder(
      categories.filter((c) => c.kind === kind),
      locale,
    ).filter(({ depth }) => depth === 0)
    if (!tops.length) return []
    return [
      {
        id: `${GROUP}${kind}`,
        label: t(`categories.kinds.${kind}`),
        children: tops.map(({ item }) => nodeOf(item)),
      },
    ]
  })
}

/**
 * Events in two cards, the current ones open and the past ones folded; a search
 * lists the matches flat. Past events stay, for old transactions.
 */
export function useEventTree(
  {
    events,
    types,
  }: { events: ReadonlyArray<EventItem>; types: ReadonlyArray<EventType> },
  query: string,
  today: string,
): Array<CheckNode> {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const matches = matcher(query)
  const leaf = (e: EventItem): CheckNode => {
    const type = types.find((x) => x.id === e.typeId)
    return {
      id: e.id,
      label: e.name,
      icon: <EventBadge color={type?.color ?? null} size="sm" />,
    }
  }
  const sorted = sortEvents(
    events.filter((e) => matches(e.name)),
    'dateDesc',
    locale,
  )
  if (query.trim()) return sorted.map(leaf)
  const card = (id: string, label: string, list: ReadonlyArray<EventItem>) =>
    list.length
      ? [{ id: `${GROUP}${id}`, label, children: list.map(leaf) }]
      : []
  return [
    ...card(
      'current',
      t('events.tabs.events'),
      sorted.filter((e) => !isPast(e, today)),
    ),
    ...card(
      'past',
      t('transactions.list.pastEvents'),
      sorted.filter((e) => isPast(e, today)),
    ),
  ]
}

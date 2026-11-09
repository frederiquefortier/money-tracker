import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import type { CheckNode } from '#/components/forms/check-list'
import { GROUP } from '#/components/forms/check-ticks'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { accountLabel } from '#/lib/accounts/account'
import { KINDS, categoryPath } from '#/lib/categories/category'
import type { Category } from '#/lib/categories/category'
import { byName } from '#/lib/people/person'
import type { Person, PersonGroup } from '#/lib/people/person'
import type { FormAccount } from '#/lib/transactions/transaction'
import { treeOrder } from '#/lib/shared/tree-layout'
import { indexById } from '#/lib/shared/collections'
import { foldForSearch } from '#/lib/shared/search'

// The trees the check lists show: accounts, people and categories as nodes.

/** Accounts under their institution: ticking one ticks all its accounts. */
export function useAccountTree(
  accounts: ReadonlyArray<FormAccount>,
  query: string,
) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const q = foldForSearch(query)
  const sorted = [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  )
  if (q)
    return sorted
      .filter((a) => foldForSearch(accountLabel(a)).includes(q))
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
 * People under their groups, as accounts under their institution (spec 20): a person in
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
  const q = foldForSearch(query)
  const sorted = byName(people, locale)
  const leaf = (p: Person) => ({ id: p.id, label: p.name })
  if (q || groups.length === 0)
    return sorted
      .filter((p) =>
        [p.name, ...p.aliases].some((n) => foldForSearch(n).includes(q)),
      )
      .map(leaf)
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
  const q = foldForSearch(query)
  const icon = (c: Category) => (
    <CategoryBadge icon={c.icon} color={c.color} size="sm" />
  )
  if (q)
    return categories
      .map((c) => ({ id: c.id, label: categoryPath(c, byId), icon: icon(c) }))
      .filter((n) => foldForSearch(n.label).includes(q))
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

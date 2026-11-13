import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchivedCategories } from '#/components/categories/list/archived-categories'
import { CategoryTree } from '#/components/categories/list/category-tree'
import { EmptyState } from '#/components/lists/list-card'
import { KindTabs } from '#/components/categories/list/kind-tabs'
import { useExpandedBranches } from '#/hooks/categories/use-expanded-branches'
import { ExpandAllButton } from '#/components/lists/expand-all-button'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { SearchField } from '#/components/forms/search-field'
import { ListPage } from '#/components/layout/list-page'
import { SortMenu } from '#/components/lists/sort-menu'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import {
  CATEGORY_SORTS,
  KINDS,
  categoryPath,
  childrenByParent,
  isArchived,
  sortSiblings,
} from '#/lib/categories/category'
import type {
  Category,
  CategorySort,
  CategoryKind,
} from '#/lib/categories/category'
import { archivedTree, categoryContext } from '#/lib/categories/category-tree'
import { matchesWithParents } from '#/lib/categories/category-list'
import { useLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getCategories } from '#/server/categories'
import { indexById, oneOf } from '#/lib/shared/collections'
import { foldForSearch } from '#/lib/shared/search'
import { listPagePending } from '#/components/layout/page-pending'

export const Route = createFileRoute('/_authed/settings/categories')({
  ...listPagePending((t) => t('categories.title')),
  loader: () => getCategories(),
  component: Categories,
})

const parseKind = oneOf(KINDS)
const parseSort = oneOf(CATEGORY_SORTS)

/**
 * One kind's active tree in the chosen order, its archived tree, each row's context, and
 * every parent of any kind (expanding all opens every tab). A query keeps the matches
 * with their parents, in both trees.
 */
function shape(
  categories: ReadonlyArray<Category>,
  {
    kind,
    sort,
    locale,
    query,
  }: { kind: CategoryKind; sort: CategorySort; locale: Locale; query: string },
) {
  const collator = FORMAT_LOCALE[locale]
  const byId = indexById(categories)
  const ofKind = categories.filter((c) => c.kind === kind)
  const activeOfKind = ofKind.filter((c) => !isArchived(c))
  const archivedOfKind = ofKind.filter(isArchived)
  const found = query ? matchesWithParents(activeOfKind, query, byId) : null
  const foundArchived = query
    ? matchesWithParents(archivedOfKind, query, byId)
    : null
  const archived = foundArchived
    ? archivedOfKind.filter((c) => foundArchived.has(c.id))
    : archivedOfKind
  const contextOf = categoryContext(categories, collator)
  const active = childrenByParent(
    categories.filter((c) => !isArchived(c)),
    collator,
  )
  const archivedParents = childrenByParent(
    categories.filter(isArchived),
    collator,
  )
  return {
    ofKind,
    childrenOf: sortSiblings(
      childrenByParent(
        found ? activeOfKind.filter((c) => found.has(c.id)) : activeOfKind,
        collator,
      ),
      sort,
      collator,
    ),
    parents: [...active.keys(), ...archivedParents.keys()].filter(
      (id) => id !== null,
    ),
    archived: {
      childrenOf: archivedTree(archived, byId, collator),
      count: archived.length,
      byId,
      pathOf: (category: Category) => categoryPath(category, byId),
    },
    contextOf,
    found,
    foundArchived,
  }
}

function AddCategoryButton({ kind }: { kind: CategoryKind }) {
  const { t } = useTranslation()
  return (
    <FloatingAddLink
      to="/settings/categories/new"
      search={{ kind }}
      label={t('categories.add')}
    />
  )
}

/** The tab and the sort, remembered per browser. */
function useView() {
  const [kind, setKind] = useStoredState<CategoryKind>(
    'categories.kind',
    'expense',
    parseKind,
  )
  const [sort, setSort] = useStoredState<CategorySort>(
    'categories.sort',
    'name',
    parseSort,
  )
  return { kind, setKind, sort, setSort }
}

function Categories() {
  const { t } = useTranslation()
  const categories = Route.useLoaderData()
  const locale = useLocale()
  const panelId = useId()
  const { kind, setKind, sort, setSort } = useView()
  const [query, setQuery] = useState('')
  const {
    ofKind,
    childrenOf,
    parents,
    archived,
    contextOf,
    found,
    foundArchived,
  } = shape(categories, { kind, sort, locale, query: foldForSearch(query) })
  const roots = childrenOf.get(null) ?? []
  const branches = useExpandedBranches(parents)

  return (
    <ListPage
      title={t('categories.title')}
      actions={
        <>
          {parents.length > 0 && !found && (
            <ExpandAllButton
              allExpanded={branches.allExpanded}
              onToggle={branches.toggleAll}
            />
          )}
          <SortMenu
            sort={sort}
            options={CATEGORY_SORTS}
            labelOf={(option) => t(`categories.sort.${option}`)}
            onChange={setSort}
          />
        </>
      }
    >
      {categories.length > 0 && (
        <SearchField value={query} onChange={setQuery} />
      )}
      <KindTabs kind={kind} panelId={panelId} onChange={setKind} />
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`tab-${kind}`}
        className="flex flex-col gap-4"
      >
        {ofKind.length === 0 && (
          <EmptyState>{t('categories.empty')}</EmptyState>
        )}
        {found && roots.length === 0 && archived.count === 0 && (
          <EmptyState>{t('common.noMatch')}</EmptyState>
        )}
        {roots.length > 0 && (
          <CategoryTree
            roots={roots}
            childrenOf={childrenOf}
            contextOf={contextOf}
            // While searching, every match shows with its path open.
            expanded={found ?? branches.expanded}
            onToggle={branches.toggle}
            onExpand={branches.expand}
          />
        )}
        <ArchivedCategories
          {...archived}
          contextOf={contextOf}
          expanded={foundArchived ?? branches.expanded}
          onToggle={branches.toggle}
          open={found !== null}
        />
      </div>
      <AddCategoryButton kind={kind} />
      {/* The category form opens here as a sheet, over the tree. */}
      <Outlet />
    </ListPage>
  )
}

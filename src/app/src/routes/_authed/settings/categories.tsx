import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddButton } from '#/components/add-button'
import { ArchivedCategories } from '#/components/categories/archived-categories'
import { CategoryTree } from '#/components/categories/category-tree'
import { KindTabs } from '#/components/categories/kind-tabs'
import { ExpandAllButton } from '#/components/expand-all-button'
import { SearchField } from '#/components/search-field'
import { SettingsPage } from '#/components/settings-page'
import { SortMenu } from '#/components/sort-menu'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import {
  CATEGORY_SORTS,
  KINDS,
  categoryPath,
  childrenByParent,
  descendantIds,
  isArchived,
  sortSiblings,
} from '#/lib/categories'
import type { Category, CategorySort, Kind } from '#/lib/categories'
import { useLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'
import { foldForSearch } from '#/lib/utils'
import { getCategories } from '#/server/categories'

export const Route = createFileRoute('/_authed/settings/categories')({
  loader: () => getCategories(),
  component: Categories,
})

const parseKind = (v: unknown) => KINDS.find((k) => k === v)
const parseSort = (v: unknown) => CATEGORY_SORTS.find((s) => s === v)
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/** The active categories whose name matches, with their parents so each keeps its path. */
function matchesWithParents(
  active: ReadonlyArray<Category>,
  query: string,
  byId: ReadonlyMap<string, Category>,
) {
  const keep = new Set<string>()
  for (const category of active) {
    if (!foldForSearch(category.name).includes(query)) continue
    for (
      let c: Category | undefined = category;
      c && !keep.has(c.id);
      c = c.parentId ? byId.get(c.parentId) : undefined
    )
      keep.add(c.id)
  }
  return keep
}

/**
 * One kind's active tree in the chosen order, its archived categories by path, each row's
 * context, and every parent of any kind (expanding all opens every tab). A query keeps
 * the matches: in the tree with their parents, in the archive by name.
 */
function shape(
  categories: ReadonlyArray<Category>,
  {
    kind,
    sort,
    locale,
    query,
  }: { kind: Kind; sort: CategorySort; locale: Locale; query: string },
) {
  const collator = FORMAT_LOCALE[locale]
  const byId = new Map(categories.map((c) => [c.id, c]))
  const allChildren = childrenByParent(categories, collator)
  const ofKind = categories.filter((c) => c.kind === kind)
  const activeOfKind = ofKind.filter((c) => !isArchived(c))
  const found = query ? matchesWithParents(activeOfKind, query, byId) : null
  const archived = ofKind
    .filter(isArchived)
    .filter((c) => !query || foldForSearch(c.name).includes(query))
    .map((category) => ({ category, path: categoryPath(category, byId) }))
    .sort((a, b) => a.path.localeCompare(b.path, collator))
  const contextOf = (category: Category) => ({
    parent: category.parentId ? byId.get(category.parentId) : undefined,
    hasChildren: allChildren.has(category.id),
    branch: [...descendantIds(category.id, allChildren)].filter((id) => {
      const c = byId.get(id)
      return c !== undefined && !isArchived(c)
    }).length,
  })
  const active = childrenByParent(
    categories.filter((c) => !isArchived(c)),
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
    parents: [...active.keys()].filter((id) => id !== null),
    archived,
    contextOf,
    found,
  }
}

function AddCategoryButton({ kind }: { kind: Kind }) {
  const { t } = useTranslation()
  return (
    <AddButton
      to="/settings/categories/new"
      search={{ kind }}
      text={t('categories.addShort')}
      label={t('categories.add')}
    />
  )
}

/** Open branches, remembered per browser, shared by every tab. */
function useExpanded(parents: ReadonlyArray<string>) {
  const [expanded, setExpanded] = useStoredState<Array<string>>(
    'categories.expanded',
    [],
    parseIds,
  )
  const allExpanded =
    parents.length > 0 && parents.every((id) => expanded.includes(id))
  return {
    expanded: new Set(expanded),
    allExpanded,
    toggle: (id: string) =>
      setExpanded(
        expanded.includes(id)
          ? expanded.filter((x) => x !== id)
          : [...expanded, id],
      ),
    toggleAll: () => setExpanded(allExpanded ? [] : [...parents]),
    expand: (id: string) => {
      if (!expanded.includes(id)) setExpanded([...expanded, id])
    },
  }
}

/** The tab and the sort, remembered per browser. */
function useView() {
  const [kind, setKind] = useStoredState<Kind>(
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
  const { ofKind, childrenOf, parents, archived, contextOf, found } = shape(
    categories,
    { kind, sort, locale, query: foldForSearch(query) },
  )
  const roots = childrenOf.get(null) ?? []
  const branches = useExpanded(parents)

  return (
    <SettingsPage
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
          <AddCategoryButton kind={kind} />
        </>
      }
    >
      <KindTabs kind={kind} panelId={panelId} onChange={setKind} />
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`tab-${kind}`}
        className="flex flex-col gap-4"
      >
        {ofKind.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            {t('categories.empty')}
          </p>
        ) : (
          <SearchField value={query} onChange={setQuery} />
        )}
        {found && roots.length === 0 && archived.length === 0 && (
          <p className="py-6 text-center text-muted-foreground">
            {t('common.noMatch')}
          </p>
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
          archived={archived}
          contextOf={contextOf}
          open={found !== null}
        />
      </div>
      {/* The category form opens here as a sheet, over the tree (spec 12). */}
      <Outlet />
    </SettingsPage>
  )
}

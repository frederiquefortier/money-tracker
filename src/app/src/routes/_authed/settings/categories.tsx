import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchivedCategories } from '#/components/categories/archived-categories'
import { CategoryTree } from '#/components/categories/category-tree'
import { KindTabs } from '#/components/categories/kind-tabs'
import { ExpandAllButton } from '#/components/expand-all-button'
import { Icon } from '#/components/icon'
import { SettingsPage } from '#/components/settings-page'
import { SortMenu } from '#/components/sort-menu'
import { Button } from '#/components/ui/button'
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
import { getCategories } from '#/server/categories'

export const Route = createFileRoute('/_authed/settings/categories')({
  loader: () => getCategories(),
  component: Categories,
})

const parseKind = (v: unknown) => KINDS.find((k) => k === v)
const parseSort = (v: unknown) => CATEGORY_SORTS.find((s) => s === v)
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/**
 * One kind's active tree in the chosen order, its archived categories by path, each row's
 * context, and every parent of any kind (expanding all opens every tab).
 */
function shape(
  categories: ReadonlyArray<Category>,
  { kind, sort, locale }: { kind: Kind; sort: CategorySort; locale: Locale },
) {
  const collator = FORMAT_LOCALE[locale]
  const byId = new Map(categories.map((c) => [c.id, c]))
  const allChildren = childrenByParent(categories, collator)
  const ofKind = categories.filter((c) => c.kind === kind)
  const archived = ofKind
    .filter(isArchived)
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
        ofKind.filter((c) => !isArchived(c)),
        collator,
      ),
      sort,
      collator,
    ),
    parents: [...active.keys()].filter((id) => id !== null),
    archived,
    contextOf,
  }
}

function AddCategoryButton({ kind }: { kind: Kind }) {
  const { t } = useTranslation()
  return (
    <Button asChild variant="outline">
      <Link to="/settings/categories/new" search={{ kind }}>
        <Icon name="plus" className="size-4" />
        {t('categories.add')}
      </Link>
    </Button>
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

function Categories() {
  const { t } = useTranslation()
  const categories = Route.useLoaderData()
  const locale = useLocale()
  const panelId = useId()
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
  const { ofKind, childrenOf, parents, archived, contextOf } = shape(
    categories,
    { kind, sort, locale },
  )
  const roots = childrenOf.get(null) ?? []
  const branches = useExpanded(parents)

  return (
    <SettingsPage
      title={t('categories.title')}
      actions={
        <>
          {parents.length > 0 && (
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
        {ofKind.length === 0 && (
          <p className="py-6 text-center text-muted-foreground">
            {t('categories.empty')}
          </p>
        )}
        {roots.length > 0 && (
          <CategoryTree
            roots={roots}
            childrenOf={childrenOf}
            contextOf={contextOf}
            expanded={branches.expanded}
            onToggle={branches.toggle}
            onExpand={branches.expand}
          />
        )}
        <ArchivedCategories archived={archived} contextOf={contextOf} />
      </div>
      {/* The category form opens here as a sheet, over the tree (spec 12). */}
      <Outlet />
    </SettingsPage>
  )
}

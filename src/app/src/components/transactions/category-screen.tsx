import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { CategoryTree } from '#/components/categories/category-tree'
import { KindTabs } from '#/components/categories/kind-tabs'
import { ExpandAllButton } from '#/components/expand-all-button'
import { IconButton } from '#/components/icon-button'
import { rowHover } from '#/components/list-card'
import { SearchField } from '#/components/search-field'
import { SortMenu } from '#/components/sort-menu'
import { useSheetEscape } from '#/components/route-sheet'
import { SheetBody } from '#/components/ui/sheet'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { CATEGORY_SORTS, categoryPath } from '#/lib/categories'
import type { Category, CategorySort, Kind } from '#/lib/categories'
import { categoryChildren, frequentCategories } from '#/lib/category-list'
import { useLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'
import { cn, focusRing } from '#/lib/utils'
import type { FrequentCategories } from '#/server/transactions'

const parseSort = (v: unknown) => CATEGORY_SORTS.find((s) => s === v)
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

/**
 * CAT-06: the most used ones of this type as a row of round icons under their heading,
 * above the tree; the full path is each one's tooltip and accessible name.
 */
function Frequent({
  categories,
  byId,
  onPick,
}: {
  categories: ReadonlyArray<Category>
  byId: ReadonlyMap<string, Category>
  onPick: (category: Category) => void
}) {
  const { t } = useTranslation()
  if (categories.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-muted-foreground">
        {t('categories.frequent')}
      </h3>
      <ul className="flex gap-1 overflow-x-auto">
        {categories.map((category) => {
          const path = categoryPath(category, byId)
          return (
            <li key={category.id}>
              <button
                type="button"
                aria-label={path}
                title={path}
                onClick={() => onPick(category)}
                className={cn(
                  'flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-xs',
                  rowHover,
                  focusRing,
                )}
              >
                <CategoryBadge
                  icon={category.icon}
                  color={category.color}
                  className="size-11 [&_svg]:size-6"
                />
                <span className="w-full truncate px-0.5 text-center">
                  {category.name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Open branches, remembered per browser and shared with the Catégories page. */
function useBranches(parents: ReadonlyArray<string>) {
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
    toggleAll: () =>
      setExpanded(
        allExpanded
          ? expanded.filter((id) => !parents.includes(id))
          : [...new Set([...expanded, ...parents])],
      ),
  }
}

function Header({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <header className="flex items-center gap-2 border-b px-3 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 md:pt-4">
      <IconButton
        icon="arrow-left"
        label={t('transactions.backToForm')}
        onClick={onBack}
      />
      <h2 className="font-mono text-lg font-bold tracking-wide uppercase">
        {t('transactions.category')}
      </h2>
    </header>
  )
}

/** "Tout déplier" and the sort, on the right, as on the list pages. */
function Toolbar({
  allExpanded,
  onToggleAll,
  sort,
  onSort,
}: {
  allExpanded: boolean
  onToggleAll: () => void
  sort: CategorySort
  onSort: (sort: CategorySort) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-2">
      <ExpandAllButton allExpanded={allExpanded} onToggle={onToggleAll} />
      <SortMenu
        sort={sort}
        options={CATEGORY_SORTS}
        labelOf={(s) => t(`categories.sort.${s}`)}
        onChange={onSort}
      />
    </div>
  )
}

/**
 * Spec 15: the category list over the whole sheet, its header included: a back arrow and
 * the title, no ✕. The toolbar and the search, kept across types, then the type tabs
 * and the Catégories tree, branches
 * collapsible as there. An expense category on a revenue is a refund.
 */
export function CategoryScreen({
  categories,
  kind: transactionKind,
  frequent,
  date,
  onPick,
  onBack,
}: {
  categories: ReadonlyArray<Category>
  kind: Kind
  frequent: FrequentCategories
  date: string
  onPick: (category: Category) => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const locale = FORMAT_LOCALE[useLocale()]
  useSheetEscape(onBack)
  const panelId = useId()
  const [kind, setKind] = useState<Kind>(transactionKind)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useStoredState<CategorySort>(
    'categories.sort',
    'name',
    parseSort,
  )
  const byId = new Map(categories.map((c) => [c.id, c]))
  const { childrenOf, open } = categoryChildren(categories, {
    kind,
    query,
    sort,
    locale,
    date,
  })
  const branches = useBranches(
    [...childrenOf.keys()].filter((id) => id !== null),
  )
  const roots = childrenOf.get(null) ?? []
  const often = kind === 'investment' ? [] : frequent[kind]

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card">
      <Header onBack={onBack} />
      <SheetBody className="flex flex-col gap-3">
        <Toolbar
          allExpanded={branches.allExpanded}
          onToggleAll={branches.toggleAll}
          sort={sort}
          onSort={setSort}
        />
        {/* Focus moves into the list from the button now under it. */}
        <SearchField value={query} onChange={setQuery} autoFocus />
        <KindTabs kind={kind} panelId={panelId} onChange={setKind} />
        <div id={panelId} className="flex flex-col gap-3">
          {!query.trim() && (
            <Frequent
              categories={frequentCategories(categories, often, date)}
              byId={byId}
              onPick={onPick}
            />
          )}
          {roots.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              {t('common.noMatch')}
            </p>
          ) : (
            <CategoryTree
              roots={roots}
              childrenOf={childrenOf}
              expanded={open ?? branches.expanded}
              onToggle={branches.toggle}
              onPick={onPick}
            />
          )}
        </div>
      </SheetBody>
    </div>
  )
}

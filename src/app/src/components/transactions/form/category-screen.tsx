import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { CategoryTree } from '#/components/categories/list/category-tree'
import { KindTabs } from '#/components/categories/list/kind-tabs'
import { useExpandedBranches } from '#/hooks/categories/use-expanded-branches'
import { IconButton } from '#/components/display/icon-button'
import { NewCategoryRow } from '#/components/transactions/form/new-category-row'
import { EmptyState } from '#/components/lists/list-card'
import { SearchField } from '#/components/forms/search-field'
import { SheetBody, SheetHead } from '#/components/ui/sheet'
import { CATEGORY_SORTS, categoryPath } from '#/lib/categories/category'
import type {
  Category,
  CategorySort,
  CategoryKind,
} from '#/lib/categories/category'
import {
  categoryChildren,
  frequentCategories,
} from '#/lib/categories/category-list'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { cn } from '#/lib/utils'
import type { FrequentCategories } from '#/lib/transactions/transaction'
import { useSheetEscape } from '#/hooks/forms/use-sheet'
import { indexById, oneOf } from '#/lib/shared/collections'
import {
  fieldSurface,
  focusRing,
  insetFocus,
  rowHover,
} from '#/components/styles'

const parseSort = oneOf(CATEGORY_SORTS)

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
      <ul className={cn('flex gap-1 overflow-x-auto', insetFocus)}>
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

/** A list over the whole sheet (categories, people): a back arrow and its title. */
export function ScreenHeader({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  return (
    <header className="flex items-center gap-2 border-b px-3 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 md:pt-4">
      <IconButton
        icon="arrow-left"
        label={t('transactions.backToForm')}
        onClick={onBack}
      />
      <h2 className="font-mono text-lg font-bold tracking-wide uppercase">
        {title}
      </h2>
    </header>
  )
}

/**
 * the category list over the whole sheet, its header included: a back arrow and
 * the title, no ✕. The toolbar and the search, kept across types, then the type tabs
 * and the Catégories tree, branches
 * collapsible as there, ending on "+ Nouvelle catégorie", which opens the category form
 * over the transaction; the saved category is picked. An expense category on a revenue
 * is a refund.
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
  kind: CategoryKind
  frequent: FrequentCategories
  date: string
  onPick: (categoryId: string) => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  useSheetEscape(onBack)
  const panelId = useId()
  const [kind, setKind] = useState<CategoryKind>(transactionKind)
  const [query, setQuery] = useState('')
  // The order chosen on Catégories, without its menu here (decided 2026-11-05).
  const [sort] = useStoredState<CategorySort>(
    'categories.sort',
    'name',
    parseSort,
  )
  const byId = indexById(categories)
  const { childrenOf, open } = categoryChildren(categories, {
    kind,
    query,
    sort,
    locale,
    date,
  })
  const branches = useExpandedBranches(
    [...childrenOf.keys()].filter((id) => id !== null),
  )
  const roots = childrenOf.get(null) ?? []
  const often = kind === 'investment' ? [] : frequent[kind]

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card">
      <ScreenHeader title={t('transactions.category')} onBack={onBack} />
      <SheetHead>
        {/* Tabs first, then the search, as in the filter sheet. */}
        <KindTabs kind={kind} panelId={panelId} onChange={setKind} />
        <SearchField value={query} onChange={setQuery} autoFocus />
      </SheetHead>
      <SheetBody className="flex flex-col gap-3">
        <div id={panelId} className="flex flex-col gap-3">
          {!query.trim() && (
            <Frequent
              categories={frequentCategories(categories, often, date)}
              byId={byId}
              onPick={(c) => onPick(c.id)}
            />
          )}
          {roots.length === 0 && <EmptyState>{t('common.noMatch')}</EmptyState>}
          <CategoryTree
            className={fieldSurface}
            roots={roots}
            childrenOf={childrenOf}
            expanded={open ?? branches.expanded}
            onToggle={branches.toggle}
            onPick={(c) => onPick(c.id)}
          >
            <NewCategoryRow
              kind={kind}
              categories={categories}
              onPick={onPick}
            />
          </CategoryTree>
        </div>
      </SheetBody>
    </div>
  )
}

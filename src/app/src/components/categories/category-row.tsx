import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryActions } from '#/components/categories/category-actions'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/icon'
import { rowHover } from '#/components/list-card'
import type { Category } from '#/lib/categories'
import { cn, focusRing } from '#/lib/utils'

/** What a row's actions need from the rest of the tree. */
export type RowContext = {
  parent: Category | undefined
  hasChildren: boolean
  branch: number
  onAddChild?: () => void
}

// One step of indent per level, no depth limit (CAT-01).
export const indentOf = (depth: number) => `${0.75 + depth * 1.75}rem`

function Label({ category, label }: { category: Category; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <CategoryBadge icon={category.icon} color={category.color} />
      <span className="truncate font-semibold">{label}</span>
    </span>
  )
}

/** Opens or closes a parent's branch; it sits where a leaf has an empty slot. */
function BranchToggle({
  name,
  expanded,
  onToggle,
}: {
  name: string
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={t('categories.branchName', { name })}
      className={cn('shrink-0 cursor-pointer rounded-lg', focusRing)}
    >
      <Icon
        name="chevron-down"
        className={cn('size-5 transition-transform', !expanded && '-rotate-90')}
      />
    </button>
  )
}

/**
 * One category in a list. Every row opens the form, or chooses the category with
 * `onPick` (no actions then); a parent also has a chevron for its branch (`toggle`).
 * `aside` sits before the actions (the archive date).
 */
export function CategoryRow({
  category,
  label,
  depth = 0,
  context,
  toggle,
  aside,
  onPick,
}: {
  category: Category
  label: string
  depth?: number
  context?: RowContext
  toggle?: { expanded: boolean; onToggle: () => void }
  aside?: React.ReactNode
  onPick?: (category: Category) => void
}) {
  const rowContent = (
    <>
      <Label category={category} label={label} />
      {aside && <span className="ml-auto pl-3">{aside}</span>}
    </>
  )
  const target = cn(
    'flex min-w-0 flex-1 items-center gap-1.5 py-2.5 text-left',
    focusRing,
  )
  return (
    <div
      className={cn('flex items-center gap-1.5 pr-2', rowHover)}
      style={{ paddingLeft: indentOf(depth) }}
    >
      {toggle ? (
        <BranchToggle name={category.name} {...toggle} />
      ) : (
        <span className="w-5 shrink-0" />
      )}
      {onPick ? (
        <button
          type="button"
          className={target}
          onClick={() => onPick(category)}
        >
          {rowContent}
        </button>
      ) : (
        <Link
          to="/settings/categories/$categoryId"
          params={{ categoryId: category.id }}
          className={target}
        >
          {rowContent}
        </Link>
      )}
      {context && (
        <CategoryActions
          category={category}
          parent={context.parent}
          hasChildren={context.hasChildren}
          branch={context.branch}
          onAddChild={context.onAddChild}
        />
      )}
    </div>
  )
}

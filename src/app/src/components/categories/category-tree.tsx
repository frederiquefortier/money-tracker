import { CategoryRow, indentOf } from '#/components/categories/category-row'
import type { RowContext } from '#/components/categories/category-row'
import { cardSurface } from '#/components/list-card'
import type { Category } from '#/lib/categories'
import { cn } from '#/lib/utils'

type TreeProps = {
  childrenOf: ReadonlyMap<string | null, ReadonlyArray<Category>>
  contextOf: (category: Category) => RowContext
  expanded: ReadonlySet<string>
  onToggle: (id: string) => void
  onExpand: (id: string) => void
}

const line = 'pointer-events-none absolute z-10 border-primary/30'

/**
 * The elbow from the parent to this child, as in a tree diagram: down from the parent's
 * chevron (on through the next siblings unless this is the last), then across to the
 * child's chevron, or to its icon when it has none. Rows are 3.5rem tall; the first
 * child's line starts under the parent's chevron, in the row above.
 */
function Connector({
  depth,
  first,
  last,
  leaf,
}: {
  depth: number
  first: boolean
  last: boolean
  leaf: boolean
}) {
  const left = `calc(${indentOf(depth - 1)} + 0.5625rem)`
  const top = first ? '-1.125rem' : '0rem'
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(line, 'border-l-2', !last && 'bottom-0')}
        style={{
          left,
          top,
          height: last ? `calc(1.75rem - ${top})` : undefined,
        }}
      />
      <span
        aria-hidden="true"
        className={cn(line, 'top-[calc(1.75rem-2px)] border-t-2')}
        style={{ left, width: leaf ? '2.8125rem' : '1.1875rem' }}
      />
    </>
  )
}

function CategoryList({
  categories,
  depth,
  ...tree
}: TreeProps & { categories: ReadonlyArray<Category>; depth: number }) {
  return (
    <ul className="divide-y">
      {categories.map((category, i) => {
        const children = tree.childrenOf.get(category.id) ?? []
        const open = tree.expanded.has(category.id)
        return (
          <li key={category.id} className="relative">
            {depth > 0 && (
              <Connector
                depth={depth}
                first={i === 0}
                last={i === categories.length - 1}
                leaf={children.length === 0}
              />
            )}
            <CategoryRow
              category={category}
              label={category.name}
              depth={depth}
              context={{
                ...tree.contextOf(category),
                // The new child shows once saved.
                onAddChild: () => tree.onExpand(category.id),
              }}
              toggle={
                children.length > 0
                  ? {
                      expanded: open,
                      onToggle: () => tree.onToggle(category.id),
                    }
                  : undefined
              }
            />
            {open && children.length > 0 && (
              <div className="border-t">
                <CategoryList
                  categories={children}
                  depth={depth + 1}
                  {...tree}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** CAT-01: active categories of one kind, each level alphabetical, parents expandable. */
export function CategoryTree({
  roots,
  ...tree
}: TreeProps & { roots: ReadonlyArray<Category> }) {
  return (
    <div className={cardSurface}>
      <CategoryList categories={roots} depth={0} {...tree} />
    </div>
  )
}

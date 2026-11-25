import { rainbowKey } from '#/lib/categories/category'
import type { TableRow } from '#/lib/dashboard/category-table'
import { compareNames } from '#/lib/shared/collections'
import { compareDecimal } from '#/lib/shared/money'

// The category table's rows in the chosen order, and which show with groups folded.

export const TABLE_SORTS = [
  'nameAsc',
  'nameDesc',
  'color',
  'amountDesc',
  'amountAsc',
  'countDesc',
  'countAsc',
] as const
export type TableSort = (typeof TABLE_SORTS)[number]

/**
 * The table's rows with each group's siblings in the chosen order, a group always over its
 * categories. An amount sort reads the last column, the period's average, which ranks as
 * its total; a missing figure goes last. A count sort reads the period's transactions.
 */
export function sortTable(
  rows: ReadonlyArray<TableRow>,
  sort: TableSort,
  locale: string,
): Array<TableRow> {
  const byName = compareNames(locale)
  const amountOf = (row: TableRow) => Object.values(row.figures).at(-1) ?? null
  const byAmount = (a: TableRow, b: TableRow) => {
    const [x, y] = [amountOf(a), amountOf(b)]
    if (x === null || y === null)
      return (x === null ? 1 : 0) - (y === null ? 1 : 0)
    return sort === 'amountDesc' ? compareDecimal(y, x) : compareDecimal(x, y)
  }
  const compare = (a: TableRow, b: TableRow) => {
    if (sort === 'nameDesc') return byName(b.category, a.category)
    if (sort === 'color') {
      const [x, y] = [
        rainbowKey(a.category.color),
        rainbowKey(b.category.color),
      ]
      return x[0] - y[0] || x[1] - y[1] || byName(a.category, b.category)
    }
    if (sort === 'nameAsc') return byName(a.category, b.category)
    if (sort === 'countDesc' || sort === 'countAsc')
      return (
        (sort === 'countDesc' ? b.count - a.count : a.count - b.count) ||
        byName(a.category, b.category)
      )
    return byAmount(a, b) || byName(a.category, b.category)
  }
  const ids = new Set(rows.map((r) => r.category.id))
  const children = new Map<string | null, Array<TableRow>>()
  for (const row of rows) {
    const parent = row.category.parentId
    const key = parent && ids.has(parent) ? parent : null
    children.set(key, [...(children.get(key) ?? []), row])
  }
  const out: Array<TableRow> = []
  const walk = (parent: string | null) => {
    for (const row of [...(children.get(parent) ?? [])].sort(compare)) {
      out.push(row)
      walk(row.category.id)
    }
  }
  walk(null)
  return out
}

/**
 * The rows to draw with groups folded: a top-level row always, the rows under it only
 * when its group is open. `folds` marks a top-level row with rows under it.
 */
export function shownRows(
  rows: ReadonlyArray<TableRow>,
  open: ReadonlySet<string>,
): Array<{ row: TableRow; folds: boolean }> {
  let group = ''
  return rows.flatMap((row, i) => {
    if (row.depth === 0) {
      group = row.category.id
      return [{ row, folds: (rows[i + 1]?.depth ?? 0) > 0 }]
    }
    return open.has(group) ? [{ row, folds: false }] : []
  })
}

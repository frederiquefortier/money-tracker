import { z } from 'zod'
import iconKeywords from '#/icons/categories/keywords.json'
import { hexToOklch, siblingVariation } from '#/lib/shared/color'
import { NECESSITIES } from '#/lib/categories/category-necessity'
import type { Necessity } from '#/lib/categories/category-necessity'
import { foldForSearch } from '#/lib/shared/search'
import { compareNames } from '#/lib/shared/collections'
import { nameFormSchema } from '#/lib/shared/validation'

// Shared by the category screens, the picker and the server functions (spec 12).

export const KINDS = ['expense', 'income', 'investment'] as const
export type CategoryKind = (typeof KINDS)[number]

export const DEFAULT_ICON = 'tag'

export type CategoryEvent = {
  status: 'archived' | 'active'
  effectiveOn: string
  /** The category it came through: the parent that archived its branch, the sub-category that brought it back. */
  viaId: string | null
}

/** `[from, to)`, null bounds open (the view `category_active_periods`). */
export type DateRange = { from: string | null; to: string | null }

export type Category = {
  id: string
  parentId: string | null
  name: string
  kind: CategoryKind
  icon: string
  iconIsAuto: boolean
  color: string
  colorIsAuto: boolean
  /** Null follows the nearest marked parent. */
  necessity: Necessity | null
  /** Newest first. */
  history: Array<CategoryEvent>
  periods: Array<DateRange>
  /** The one category of every fee, conversion and transaction (TRX-04, CUR-08). */
  isFee?: boolean
  /** A transaction has a split in it, so it cannot be deleted. */
  inUse?: boolean
}

export function isArchived(category: Pick<Category, 'history'>) {
  return category.history[0]?.status === 'archived'
}

/** CAT-04: a category archived in March still applies to a February transaction. */
export function isActiveOn(category: Pick<Category, 'periods'>, date: string) {
  return category.periods.some(
    (p) =>
      (p.from === null || p.from <= date) && (p.to === null || date < p.to),
  )
}

// Quick picks: clean, saturated colours around the five the author chose (ruby, yellow,
// green, royal, purple), deep ones with a white icon and bright ones with a dark icon,
// each far enough from the others to tell apart, in rainbow order (spec 12).
export const SWATCHES = [
  { key: 'ruby', hex: '#c30839' },
  { key: 'burgundy', hex: '#850e2c' },
  { key: 'coral', hex: '#f45340' },
  { key: 'tangerine', hex: '#fe7802' },
  { key: 'amber', hex: '#fea91e' },
  { key: 'yellow', hex: '#ffcc00' },
  { key: 'lime', hex: '#8bd737' },
  { key: 'green', hex: '#218b30' },
  { key: 'forest', hex: '#095c34' },
  { key: 'aqua', hex: '#1ed1cd' },
  { key: 'cyan', hex: '#11a7d7' },
  { key: 'royal', hex: '#0754c6' },
  { key: 'navy', hex: '#132e7f' },
  { key: 'indigo', hex: '#5828c4' },
  { key: 'purple', hex: '#8d35c0' },
  { key: 'lavender', hex: '#bf89ec' },
  { key: 'plum', hex: '#6b2470' },
  { key: 'pink', hex: '#f83599' },
  { key: 'slate', hex: '#5a6a80' },
] as const

export const CATEGORY_ICONS: ReadonlyArray<{
  name: string
  words: ReadonlyArray<string>
}> = iconKeywords

// Hyphens and punctuation become spaces, so "shopping cart" finds `shopping-cart`.
const searchable = (text: string) =>
  foldForSearch(text)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const ICON_NAMES = new Set(CATEGORY_ICONS.map((i) => i.name))
const FOLDED = CATEGORY_ICONS.map((icon) => ({
  name: icon.name,
  words: icon.words.map(searchable),
}))

/**
 * The first icon with a word in the name ("Essence", "Frais bancaires") or a plural of one
 * ("Restaurants"). Failing that, the first with a word the name begins while being typed
 * ("Épic"), so "Transport" finds `car` before "transport en commun" finds `bus`.
 */
export function suggestIcon(name: string): string {
  const typed = searchable(name)
  if (!typed) return DEFAULT_ICON
  const padded = ` ${typed} `
  const whole = FOLDED.find((icon) =>
    icon.words.some((w) =>
      [w, `${w}s`, `${w}x`].some((form) => padded.includes(` ${form} `)),
    ),
  )
  const begun =
    typed.length >= 3
      ? FOLDED.find((icon) => icon.words.some((w) => w.startsWith(typed)))
      : undefined
  return (whole ?? begun)?.name ?? DEFAULT_ICON
}

export function searchIcons(query: string) {
  const q = searchable(query)
  if (!q) return CATEGORY_ICONS
  return CATEGORY_ICONS.filter(
    (_, i) =>
      FOLDED[i]?.name.includes(q) ||
      FOLDED[i]?.words.some((w) => w.includes(q)),
  )
}

/** Children of each parent (null: top level), alphabetical (CAT-01). */
export function childrenByParent<T extends Pick<Category, 'parentId' | 'name'>>(
  categories: ReadonlyArray<T>,
  locale: string,
) {
  const map = new Map<string | null, Array<T>>()
  for (const category of categories) {
    const list = map.get(category.parentId) ?? []
    list.push(category)
    map.set(category.parentId, list)
  }
  for (const list of map.values()) list.sort(compareNames(locale))
  return map
}

export const CATEGORY_SORTS = ['name', 'nameDesc', 'color'] as const
export type CategorySort = (typeof CATEGORY_SORTS)[number]

// Rainbow order from red; greys last, darker first.
function rainbowKey(hex: string) {
  const { l, c, h } = hexToOklch(hex)
  return [c < 0.05 ? 1 : 0, c < 0.05 ? l : (h - 10 + 360) % 360] as const
}

/** Siblings in the chosen order: by name (CAT-01), by name backwards, or by colour, like a rainbow. */
export function sortSiblings<T extends Pick<Category, 'name' | 'color'>>(
  children: ReadonlyMap<string | null, ReadonlyArray<T>>,
  sort: CategorySort,
  locale: string,
) {
  if (sort === 'name') return children
  if (sort === 'nameDesc')
    return new Map(
      [...children].map(([id, list]) => [id, [...list].reverse()] as const),
    )
  const byName = compareNames(locale)
  const byColor = (a: T, b: T) => {
    const [x, y] = [rainbowKey(a.color), rainbowKey(b.color)]
    return x[0] - y[0] || x[1] - y[1] || byName(a, b)
  }
  return new Map(
    [...children].map(([id, list]) => [id, [...list].sort(byColor)] as const),
  )
}

/** "Transport > Taxi". */
export function categoryPath(
  category: Pick<Category, 'parentId' | 'name'>,
  byId: ReadonlyMap<string, Pick<Category, 'parentId' | 'name'>>,
) {
  const names = [category.name]
  let parent = category.parentId ? byId.get(category.parentId) : undefined
  while (parent) {
    names.unshift(parent.name)
    parent = parent.parentId ? byId.get(parent.parentId) : undefined
  }
  return names.join(' > ')
}

export function descendantIds(
  id: string,
  children: ReadonlyMap<string | null, ReadonlyArray<{ id: string }>>,
) {
  const found = new Set<string>()
  const queue = [id]
  while (queue.length) {
    for (const child of children.get(queue.pop() ?? '') ?? []) {
      found.add(child.id)
      queue.push(child.id)
    }
  }
  return found
}

type Colored = Pick<
  Category,
  'id' | 'parentId' | 'name' | 'color' | 'colorIsAuto'
>

/**
 * The colour every category ends up with: an automatic one is a variation of its parent's
 * by its place among its siblings, so a branch follows its parent (spec 12).
 */
export function resolveColors(
  categories: ReadonlyArray<Colored>,
  locale: string,
) {
  const children = childrenByParent(categories, locale)
  const colors = new Map<string, string>()
  const visit = (parentColor: string | null, list: ReadonlyArray<Colored>) =>
    list.forEach((category, index) => {
      const color =
        category.colorIsAuto && parentColor
          ? siblingVariation(parentColor, index)
          : category.color
      colors.set(category.id, color)
      visit(color, children.get(category.id) ?? [])
    })
  visit(null, children.get(null) ?? [])
  return colors
}

// Sibling order for colours is fixed, so switching the interface language never
// recolours a branch.
export const COLOR_ORDER_LOCALE = 'fr-CA'

/** The automatic colour a category being edited would get under `parentId`. */
export function autoColor(
  categories: ReadonlyArray<Colored>,
  self: { id?: string; parentId: string; name: string },
) {
  const id = self.id ?? ''
  const list = [
    ...categories.filter((c) => c.id !== id),
    { ...self, id, color: '#000000', colorIsAuto: true },
  ]
  return resolveColors(list, COLOR_ORDER_LOCALE).get(id) ?? '#000000'
}

/** The quick picks other top-level categories of `kind` already use. */
export function usedTopColors(
  categories: ReadonlyArray<
    Pick<Category, 'id' | 'parentId' | 'kind' | 'color'>
  >,
  kind: CategoryKind,
  selfId?: string,
) {
  return new Set(
    categories
      .filter((c) => !c.parentId && c.kind === kind && c.id !== selfId)
      .map((c) => c.color),
  )
}

/** A new top-level category gets the first quick pick no other one of its kind uses. */
export function nextTopColor(
  categories: ReadonlyArray<
    Pick<Category, 'id' | 'parentId' | 'kind' | 'color'>
  >,
  kind: CategoryKind,
) {
  const used = usedTopColors(categories, kind)
  const free = SWATCHES.find((s) => !used.has(s.hex))
  return (free ?? SWATCHES[used.size % SWATCHES.length]).hex
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/

export const categoryInputSchema = nameFormSchema.extend({
  id: z.uuid().optional(),
  kind: z.enum(KINDS),
  parentId: z.uuid().nullable(),
  icon: z.string().refine((name) => ICON_NAMES.has(name)),
  iconIsAuto: z.boolean(),
  color: z.string().regex(HEX_COLOR),
  colorIsAuto: z.boolean(),
  necessity: z.enum(NECESSITIES).nullable(),
  isFee: z.boolean().optional(),
})
export type CategoryInput = z.input<typeof categoryInputSchema>

export type CategoryError =
  | 'nameTaken'
  | 'inUse'
  | 'parentArchived'
  | 'beforePrevious'
  | 'pauseOverlaps'
  | 'notFound'
  | 'failed'

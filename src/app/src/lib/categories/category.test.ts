import { describe, expect, it } from 'vitest'
import { contrast, distance, iconColor } from '#/lib/shared/color'
import {
  CATEGORY_ICONS,
  SWATCHES,
  categoryPath,
  childrenByParent,
  descendantIds,
  isActiveOn,
  nextTopColor,
  sortSiblings,
  usedTopColors,
  resolveColors,
  searchIcons,
  suggestIcon,
} from '#/lib/categories/category'
import categoryGlyphs from '#/icons/categories/glyphs.json'
import customGlyphs from '#/icons/categories/custom.json'

const category = (
  id: string,
  name: string,
  more: {
    parentId?: string
    color?: string
    colorIsAuto?: boolean
    kind?: 'expense' | 'income'
  } = {},
) => ({
  id,
  name,
  kind: more.kind ?? 'expense',
  parentId: more.parentId ?? null,
  color: more.color ?? '#aa3322',
  colorIsAuto: more.colorIsAuto ?? false,
})

describe('the icon list', () => {
  it('lists each icon once, with its own name among its words', () => {
    const names = CATEGORY_ICONS.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
    for (const icon of CATEGORY_ICONS) expect(icon.words).toContain(icon.name)
  })

  it('keeps every word lowercase plain text', () => {
    for (const word of CATEGORY_ICONS.flatMap((i) => i.words))
      expect(word).toMatch(/^[\p{Ll}\p{N}][\p{Ll}\p{N} '’-]*$/u)
  })

  it('has a drawing for every icon', () => {
    for (const icon of CATEGORY_ICONS)
      expect({ ...categoryGlyphs.icons, ...customGlyphs.icons }).toHaveProperty(
        icon.name,
      )
  })
})

describe('suggestIcon', () => {
  it('finds the specific icon before the general one', () => {
    expect(suggestIcon('Essence')).toBe('fuel')
    expect(suggestIcon('Transport en commun')).toBe('bus')
    expect(suggestIcon('Transport')).toBe('car')
    expect(suggestIcon('Loyer')).toBe('key')
    expect(suggestIcon('Retours gouvernementaux')).toBe('building-4')
  })

  it('covers classes, hobbies and paperwork', () => {
    expect(suggestIcon('Piano')).toBe('music-notes')
    expect(suggestIcon('Poterie')).toBe('potted-plant')
    expect(suggestIcon('Vitrail')).toBe('component')
    expect(suggestIcon('Ballet')).toBe('accessibility-alt')
    expect(suggestIcon('Pole dance')).toBe('divider')
    expect(suggestIcon('Entraîneur')).toBe('stopwatch')
    expect(suggestIcon('Donjons et dragons')).toBe('dice')
    expect(suggestIcon('Immatriculation')).toBe('id-card')
    expect(suggestIcon('Documents')).toBe('file-text')
  })

  it('reads plurals, accents, a name being typed and the icon name', () => {
    expect(suggestIcon('Restaurants')).toBe('utensils')
    expect(suggestIcon('EPICERIE')).toBe('shopping-cart')
    expect(suggestIcon('Épic')).toBe('shopping-cart')
    expect(suggestIcon('shopping cart')).toBe('shopping-cart')
  })

  it('falls back to the neutral tag', () => {
    expect(suggestIcon('Zzz')).toBe('tag')
    expect(suggestIcon('')).toBe('tag')
  })
})

describe('searchIcons', () => {
  it('matches words in either language', () => {
    const names = searchIcons('groceries').map((i) => i.name)
    expect(names).toContain('shopping-cart')
    expect(searchIcons('')).toHaveLength(CATEGORY_ICONS.length)
  })
})

describe('the tree', () => {
  const list = [
    category('t', 'Transport'),
    category('a', 'Alimentation'),
    category('r', 'Restaurants', { parentId: 'a' }),
    category('e', 'Épicerie', { parentId: 'a' }),
    category('c', 'Café', { parentId: 'r' }),
  ]

  it('sorts each level alphabetically', () => {
    const children = childrenByParent(list, 'fr-CA')
    expect(children.get(null)?.map((c) => c.name)).toEqual([
      'Alimentation',
      'Transport',
    ])
    expect(children.get('a')?.map((c) => c.name)).toEqual([
      'Épicerie',
      'Restaurants',
    ])
  })

  it('writes the full path and finds the whole branch', () => {
    const byId = new Map(list.map((c) => [c.id, c]))
    expect(categoryPath(category('c', 'Café', { parentId: 'r' }), byId)).toBe(
      'Alimentation > Restaurants > Café',
    )
    const children = childrenByParent(list, 'fr-CA')
    expect([...descendantIds('a', children)].sort()).toEqual(['c', 'e', 'r'])
  })
})

describe('isActiveOn', () => {
  const periods = [
    { from: null, to: '2024-03-03' },
    { from: '2025-01-01', to: null },
  ]

  it('follows the archive history, the archive date excluded', () => {
    expect(isActiveOn({ periods }, '2024-02-15')).toBe(true)
    expect(isActiveOn({ periods }, '2024-03-03')).toBe(false)
    expect(isActiveOn({ periods }, '2025-06-01')).toBe(true)
  })
})

describe('colours', () => {
  it('keeps the icon of every quick pick at 3:1', () => {
    for (const swatch of SWATCHES)
      expect(
        contrast(iconColor(swatch.hex), swatch.hex),
      ).toBeGreaterThanOrEqual(3)
  })

  it('makes automatic children follow their parent, and keeps a hand-picked one', () => {
    const list = [
      category('a', 'Alimentation'),
      category('e', 'Épicerie', {
        parentId: 'a',
        color: '#000000',
        colorIsAuto: true,
      }),
      category('r', 'Restaurants', {
        parentId: 'a',
        color: '#000000',
        colorIsAuto: true,
      }),
      category('x', 'Extra', { parentId: 'a', color: '#123456' }),
    ]
    const colors = resolveColors(list, 'fr-CA')
    expect(colors.get('e')).not.toBe('#000000')
    expect(colors.get('e')).not.toBe(colors.get('r'))
    expect(colors.get('x')).toBe('#123456')
    const moved = resolveColors(
      list.map((c) => (c.id === 'a' ? { ...c, color: '#2255aa' } : c)),
      'fr-CA',
    )
    expect(moved.get('e')).not.toBe(colors.get('e'))
  })

  it('gives a new top-level category a quick pick unused in its kind', () => {
    const first = SWATCHES[0].hex
    const taken = [category('a', 'A', { color: first })]
    expect(nextTopColor([], 'expense')).toBe(first)
    expect(nextTopColor(taken, 'expense')).toBe(SWATCHES[1].hex)
    expect(nextTopColor(taken, 'income')).toBe(first)
  })

  it('lists the quick picks other top-level categories of a kind use', () => {
    const list = [
      category('a', 'A', { color: '#111111' }),
      category('b', 'B', { color: '#222222' }),
      category('c', 'C', { color: '#333333', kind: 'income' }),
      category('d', 'D', { color: '#444444', parentId: 'a' }),
    ]
    expect([...usedTopColors(list, 'expense', 'a')]).toEqual(['#222222'])
  })

  it('sorts siblings by colour like a rainbow, greys last', () => {
    const list = [
      category('b', 'Bleu', { color: '#0754c6' }),
      category('g', 'Gris', { color: '#5a6a80' }),
      category('r', 'Rouge', { color: '#c30839' }),
      category('j', 'Jaune', { color: '#ffcc00' }),
      category('p', 'Rose', { color: '#f83599' }),
    ]
    const sorted = sortSiblings(
      childrenByParent(list, 'fr-CA'),
      'color',
      'fr-CA',
    )
    expect(sorted.get(null)?.map((c) => c.id)).toEqual([
      'r',
      'j',
      'b',
      'p',
      'g',
    ])
  })

  it('keeps the quick picks apart', () => {
    for (const a of SWATCHES)
      for (const b of SWATCHES)
        if (a !== b) expect(distance(a.hex, b.hex)).toBeGreaterThan(8)
  })
})

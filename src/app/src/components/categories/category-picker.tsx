import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Combobox } from '#/components/combobox'
import type { ComboboxOption } from '#/components/use-combobox'
import { useServerAction } from '#/components/use-server-action'
import { useToast } from '#/components/toaster'
import { FORMAT_LOCALE } from '#/i18n/locales'
import {
  KINDS,
  categoryPath,
  isActiveOn,
  nextTopColor,
  suggestIcon,
} from '#/lib/categories'
import type { Category, Kind } from '#/lib/categories'
import { todayIso } from '#/lib/format'
import { treeOrder } from '#/lib/tree'
import { useLocale } from '#/lib/use-locale'
import { saveCategory, setCategoryFavourite } from '#/server/categories'

/** Stars flip at once and stay until refreshed data includes them, as on the rows. */
function useStars(categories: ReadonlyArray<Category>) {
  const { run } = useServerAction()
  const [changes, setChanges] = useState<
    ReadonlyMap<string, { on: boolean; from: boolean }>
  >(new Map())
  const shown = (category: Category) => {
    const change = changes.get(category.id)
    return change && change.from === category.isFavourite
      ? change.on
      : category.isFavourite
  }
  function toggle(category: Category) {
    const on = !shown(category)
    setChanges((map) =>
      new Map(map).set(category.id, { on, from: category.isFavourite }),
    )
    run(() => setCategoryFavourite({ data: { id: category.id, on } }), {
      onResult: (ok) =>
        !ok &&
        setChanges((map) => {
          const next = new Map(map)
          next.delete(category.id)
          return next
        }),
    })
  }
  return {
    shown,
    toggle,
    favourites: () =>
      new Set(categories.filter((c) => shown(c)).map((c) => c.id)),
  }
}

/** "Créer « … »": a top-level category of the picker's type, icon and colour suggested. */
function useCreate(
  categories: ReadonlyArray<Category>,
  kind: Kind,
  onCreated: (category: Category) => void,
) {
  const { t } = useTranslation()
  const toast = useToast()
  const router = useRouter()
  return async (name: string) => {
    const values = {
      name,
      kind,
      parentId: null,
      icon: suggestIcon(name),
      iconIsAuto: true,
      color: nextTopColor(categories, kind),
      colorIsAuto: false,
    }
    const result = await saveCategory({ data: values }).catch(() => null)
    if (!result?.ok) {
      toast({ text: t('common.saveFailed') })
      return
    }
    onCreated({
      ...values,
      id: result.id,
      isFavourite: false,
      history: [],
      periods: [{ from: null, to: null }],
    })
    await router.invalidate()
  }
}

/**
 * Favoris by path, then one tree per type with `kind` first, drawn like the Catégories
 * page. A favourite stays in its tree too, so no branch loses its parent.
 */
function groupedOptions(
  categories: ReadonlyArray<Category>,
  {
    kind,
    favourites,
    locale,
    option,
    groupLabel,
  }: {
    kind: Kind
    favourites: ReadonlySet<string>
    locale: string
    option: (category: Category, group: string) => ComboboxOption
    groupLabel: (kind: Kind | null) => string
  },
) {
  const kinds = [kind, ...KINDS.filter((k) => k !== kind)]
  return [
    ...categories
      .filter((c) => favourites.has(c.id))
      .map((c) => option(c, groupLabel(null)))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    ...kinds.flatMap((k) =>
      treeOrder(
        categories.filter((c) => c.kind === k),
        locale,
      ).map(({ item, depth }) => ({
        ...option(item, groupLabel(k)),
        depth,
        parent: item.parentId ?? undefined,
        short: item.name,
      })),
    ),
  ]
}

/**
 * CAT-04, 06 (spec 15): Favoris first, then one group per type with `kind` first, each
 * category by its full path. Only categories active on `date` are listed; a chosen one
 * that is not stays in the field, tagged "Archivée".
 */
export function CategoryPicker({
  label,
  categories: loaded,
  value,
  onChange,
  kind = 'expense',
  date = todayIso(),
  required = false,
}: {
  label: string
  categories: ReadonlyArray<Category>
  value: string | null
  onChange: (id: string | null) => void
  kind?: Kind
  date?: string
  required?: boolean
}) {
  const { t } = useTranslation()
  const locale = FORMAT_LOCALE[useLocale()]
  const [created, setCreated] = useState<Array<Category>>([])
  const categories = [
    ...loaded,
    ...created.filter((c) => !loaded.some((l) => l.id === c.id)),
  ]
  const stars = useStars(categories)
  // The Favoris group is fixed while the list is open, so a star never moves its option.
  const [placed, setPlaced] = useState<ReadonlySet<string> | null>(null)
  const favourites = placed ?? stars.favourites()
  const create = useCreate(categories, kind, (category) => {
    setCreated((list) => [...list, category])
    onChange(category.id)
  })

  const byId = new Map(categories.map((c) => [c.id, c]))
  const option = (category: Category, group: string): ComboboxOption => {
    const active = isActiveOn(category, date)
    const name = category.name
    const starred = stars.shown(category)
    return {
      value: category.id,
      label: categoryPath(category, byId),
      icon: (
        <CategoryBadge icon={category.icon} color={category.color} size="sm" />
      ),
      group,
      hidden: !active,
      tag: active ? undefined : t('categories.archivedTag'),
      action: {
        icon: starred ? 'star-fill' : 'star',
        label: t('categories.favouriteName', { name }),
        pressed: starred,
        onClick: () => stars.toggle(category),
      },
    }
  }
  const options = groupedOptions(categories, {
    kind,
    favourites,
    locale,
    option,
    groupLabel: (k) => t(k ? `categories.kinds.${k}` : 'categories.favourites'),
  })

  return (
    <Combobox
      label={label}
      required={required}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('categories.clearCategory')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={(name) => void create(name)}
      onOpenChange={(open) => setPlaced(open ? stars.favourites() : null)}
    />
  )
}

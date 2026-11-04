import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Combobox } from '#/components/combobox'
import type { ComboboxOption } from '#/components/use-combobox'
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
import { saveCategory } from '#/server/categories'

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
      history: [],
      periods: [{ from: null, to: null }],
    })
    await router.invalidate()
  }
}

/** One tree per type, `kind` first, drawn like the Catégories page. */
function treeOptions(
  categories: ReadonlyArray<Category>,
  {
    kind,
    locale,
    option,
  }: {
    kind: Kind
    locale: string
    option: (category: Category) => ComboboxOption
  },
) {
  const kinds = [kind, ...KINDS.filter((k) => k !== kind)]
  return kinds.flatMap((k) =>
    treeOrder(
      categories.filter((c) => c.kind === k),
      locale,
    ).map(({ item, depth }) => ({
      ...option(item),
      depth,
      parent: item.parentId ?? undefined,
      short: item.name,
    })),
  )
}

/**
 * CAT-04 (spec 15): one group per type with `kind` first, each a tree. Only categories active on `date` are listed; a chosen one
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
  const create = useCreate(categories, kind, (category) => {
    setCreated((list) => [...list, category])
    onChange(category.id)
  })

  const byId = new Map(categories.map((c) => [c.id, c]))
  const option = (category: Category): ComboboxOption => {
    const active = isActiveOn(category, date)
    return {
      value: category.id,
      label: categoryPath(category, byId),
      icon: (
        <CategoryBadge icon={category.icon} color={category.color} size="sm" />
      ),
      group: t(`categories.kinds.${category.kind}`),
      hidden: !active,
      tag: active ? undefined : t('categories.archivedTag'),
    }
  }
  const options = treeOptions(categories, { kind, locale, option })

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
    />
  )
}

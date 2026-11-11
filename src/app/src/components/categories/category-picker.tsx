import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Combobox } from '#/components/combobox/combobox'
import type { ComboboxOption } from '#/hooks/forms/use-combobox'
import { useInlineCreate } from '#/hooks/forms/use-inline-create'
import {
  KINDS,
  categoryPath,
  isActiveOn,
  nextTopColor,
  suggestIcon,
} from '#/lib/categories/category'
import type { Category, CategoryKind } from '#/lib/categories/category'
import { todayIso } from '#/lib/shared/format'
import { treeOrder } from '#/lib/shared/tree-layout'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { saveCategory } from '#/server/categories'
import { indexById } from '#/lib/shared/collections'

/** "Créer « … »": a top-level category of the picker's type, icon and colour suggested. */
async function createTopCategory(
  name: string,
  {
    kind,
    categories,
  }: { kind: CategoryKind; categories: ReadonlyArray<Category> },
): Promise<Category | null> {
  const values = {
    name,
    kind,
    parentId: null,
    icon: suggestIcon(name),
    iconIsAuto: true,
    color: nextTopColor(categories, kind),
    colorIsAuto: false,
    necessity: null,
  }
  const result = await saveCategory({ data: values })
  if (!result.ok) return null
  return {
    ...values,
    id: result.id,
    history: [],
    periods: [{ from: null, to: null }],
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
    kind: CategoryKind
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
 * CAT-04, 06: "Fréquentes" first while nothing is typed, each by its full path,
 * then one group per type with `kind` first, each a tree. Only categories active on `date`
 * are listed; a chosen one that is not stays in the field, tagged "Archivée".
 */
export function CategoryPicker({
  label,
  categories: loaded,
  value,
  onChange,
  kind = 'expense',
  date = todayIso(),
  frequent = [],
  required = false,
  error,
  creatable = true,
  extra = [],
}: {
  label: string
  categories: ReadonlyArray<Category>
  value: string | null
  onChange: (id: string | null) => void
  kind?: CategoryKind
  date?: string
  /** The most used category ids of `kind`, most used first. */
  frequent?: ReadonlyArray<string>
  required?: boolean
  error?: string
  /** False in a filter, where typing a name must not create a category. */
  creatable?: boolean
  /** Choices listed first, before the categories ("No category" in a filter). */
  extra?: ReadonlyArray<ComboboxOption>
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { items: categories, create } = useInlineCreate(loaded, {
    save: (name, listed) =>
      createTopCategory(name, { kind, categories: listed }),
    onCreated: (category) => onChange(category.id),
  })

  const byId = indexById(categories)
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
  const frequentOptions = frequent.flatMap((id) => {
    const category = byId.get(id)
    if (!category || !isActiveOn(category, date)) return []
    const o = option(category)
    return [
      {
        ...o,
        short: o.label,
        group: t('categories.frequent'),
        browseOnly: true,
      },
    ]
  })
  const options = [
    ...extra,
    ...frequentOptions,
    ...treeOptions(categories, { kind, locale, option }),
  ]

  return (
    <Combobox
      label={label}
      required={required}
      error={error}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('categories.clearCategory')}
      createLabel={
        creatable ? (text) => t('common.createText', { text }) : undefined
      }
      onCreate={creatable ? create : undefined}
    />
  )
}

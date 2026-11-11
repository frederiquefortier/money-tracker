import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { Combobox } from '#/components/combobox/combobox'
import { PersonAvatar } from '#/components/people/avatars'
import type { Person } from '#/lib/people/person'
import { FormField } from '#/components/forms/form-field'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import type { Category } from '#/lib/categories/category'
import type { Merchant } from '#/lib/merchants/merchant'
import { nameFormSchema } from '#/lib/shared/validation'
import { saveMerchant } from '#/server/merchants'

/** Spec 13. A new default category applies to new transactions only (MER-01). */
export function MerchantForm({
  merchant,
  categories,
  people,
  savedText,
}: {
  merchant: Merchant | null
  categories: ReadonlyArray<Category>
  people: ReadonlyArray<Person>
  savedText: string
}) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState(
    merchant?.defaultCategoryId ?? null,
  )
  const [personId, setPersonId] = useState(merchant?.personId ?? null)
  const form = useSheetForm({
    schema: nameFormSchema,
    initial: { name: merchant?.name ?? '' },
    save: (data) =>
      saveMerchant({
        data: {
          ...data,
          id: merchant?.id,
          defaultCategoryId: categoryId,
          personId,
        },
      }),
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      <FormField {...form.field('name')} label={t('merchants.name')} required />
      <CategoryPicker
        label={t('merchants.defaultCategory')}
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
      />
      <Combobox
        label={t('merchants.person')}
        options={people
          .filter((p) => !p.archivedOn || p.id === personId)
          .map((p) => ({
            value: p.id,
            label: p.name,
            keywords: p.aliases.join(' '),
            icon: <PersonAvatar name={p.name} size="sm" />,
          }))}
        value={personId}
        onChange={setPersonId}
        clearLabel={t('common.clear')}
      />
    </SheetForm>
  )
}

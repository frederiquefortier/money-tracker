import { useTranslation } from 'react-i18next'
import { FormField } from '#/components/form-field'
import { SheetForm } from '#/components/sheet-form'
import { useSheetForm } from '#/components/use-sheet-form'
import { institutionFormSchema } from '#/lib/accounts'
import { saveInstitution } from '#/server/accounts'
import type { Institution } from '#/server/accounts'

/** ACC-05, in the same sheet as the account form. */
export function InstitutionForm({
  institution,
}: {
  institution: Institution | null
}) {
  const { t } = useTranslation()
  const form = useSheetForm({
    schema: institutionFormSchema,
    initial: {
      name: institution?.name ?? '',
      websiteUrl: institution?.websiteUrl ?? '',
    },
    save: (data) => saveInstitution({ data: { ...data, id: institution?.id } }),
    savedText: t('institutions.saved'),
  })

  return (
    <SheetForm {...form.formProps}>
      <FormField
        {...form.field('name')}
        label={t('institutions.name')}
        required
      />
      <FormField
        {...form.field('websiteUrl')}
        type="url"
        inputMode="url"
        placeholder="https://"
        label={t('institutions.website')}
      />
    </SheetForm>
  )
}

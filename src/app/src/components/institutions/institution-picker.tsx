import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { useInlineCreate } from '#/hooks/forms/use-inline-create'
import { saveInstitution } from '#/server/institutions'
import type { Institution } from '#/lib/institutions/institution'

/** ACC-05: pick an institution, or create one by typing its name. */
export function InstitutionPicker({
  institutions: loaded,
  value,
  onChange,
}: {
  institutions: ReadonlyArray<Institution>
  value: string | null
  onChange: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const { items: institutions, create } = useInlineCreate(loaded, {
    save: async (name) => {
      const result = await saveInstitution({ data: { name, websiteUrl: '' } })
      return result.ok ? { id: result.id, name, websiteUrl: null } : null
    },
    onCreated: (institution) => onChange(institution.id),
  })

  return (
    <Combobox
      label={t('accounts.institution')}
      options={institutions.map((i) => ({ value: i.id, label: i.name }))}
      value={value}
      onChange={onChange}
      clearLabel={t('accounts.clearInstitution')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={create}
    />
  )
}

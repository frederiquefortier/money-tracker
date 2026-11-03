import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { useToast } from '#/components/toaster'
import { saveInstitution } from '#/server/accounts'
import type { Institution } from '#/server/accounts'

/** ACC-05: pick an institution, or create one by typing its name. */
export function InstitutionPicker({
  institutions,
  value,
  onChange,
}: {
  institutions: ReadonlyArray<Institution>
  value: string | null
  onChange: (id: string | null, created?: Institution) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()

  async function create(name: string) {
    const result = await saveInstitution({ data: { name, websiteUrl: '' } })
    if (result.ok)
      onChange(result.id, { id: result.id, name, websiteUrl: null })
    else toast({ text: t('common.saveFailed') })
  }

  return (
    <Combobox
      label={t('accounts.institution')}
      options={institutions.map((i) => ({ value: i.id, label: i.name }))}
      value={value}
      onChange={(id) => onChange(id)}
      clearLabel={t('accounts.clearInstitution')}
      createLabel={(text) => t('accounts.createInstitution', { text })}
      onCreate={(name) => void create(name)}
    />
  )
}

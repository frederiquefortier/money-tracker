import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { AnonymousAvatar, PersonAvatar } from '#/components/people/avatars'
import { useInlineCreate } from '#/hooks/forms/use-inline-create'
import { byName } from '#/lib/shared/collections'
import type { Person } from '#/lib/people/person'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { ANONYMOUS } from '#/lib/transactions/transaction-source'
import { savePerson } from '#/server/people'

/**
 * One person, typed into the field: who an income came from (spec 20), in place of the
 * merchant, or Sans nom; or who an expense was bought from (PPL-08). Names and aliases match; "Créer « … »" adds someone. Archived people are
 * listed only while chosen.
 */
export function PersonPicker({
  people: loaded,
  value,
  label,
  hideLabel = false,
  anonymous = true,
  onChange,
}: {
  people: ReadonlyArray<Person>
  value: string | null
  label?: string
  hideLabel?: boolean
  /** Offers Sans nom: an income from someone without a name (spec 21). */
  anonymous?: boolean
  onChange: (personId: string | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { items: people, create } = useInlineCreate<Person>(loaded, {
    save: async (name) => {
      const result = await savePerson({
        data: { name, groupIds: [], aliases: [] },
      })
      return result.ok
        ? {
            id: result.id,
            name,
            archivedOn: null,
            groupIds: [],
            aliases: [],
            transactionCount: 0,
          }
        : null
    },
    onCreated: (person) => onChange(person.id),
  })
  // Sans nom first: an income from someone without a name pays back their lines (spec 21).
  const options = [
    ...(anonymous
      ? [
          {
            value: ANONYMOUS,
            label: t('transactions.people.anonymous'),
            icon: <AnonymousAvatar count={1} size="sm" />,
          },
        ]
      : []),
    ...byName(
      people.filter((p) => !p.archivedOn || p.id === value),
      locale,
    ).map((p) => ({
      value: p.id,
      label: p.name,
      keywords: p.aliases.join(' '),
      icon: <PersonAvatar name={p.name} size="sm" />,
    })),
  ]
  return (
    <Combobox
      label={label ?? t('transactions.people.source')}
      hideLabel={hideLabel}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('common.clear')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={create}
    />
  )
}

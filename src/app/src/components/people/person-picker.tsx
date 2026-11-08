import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox'
import { AnonymousAvatar, PersonAvatar } from '#/components/people/avatars'
import { useInlineCreate } from '#/components/use-inline-create'
import { byName } from '#/lib/people'
import type { Person } from '#/lib/people'
import { useFormatLocale } from '#/lib/use-locale'
import { ANONYMOUS } from '#/lib/transaction-source'
import { savePerson } from '#/server/people'

/**
 * One person, typed into the field: who an income came from (spec 20), in place of the
 * merchant, or Sans nom. Names and aliases match; "Créer « … »" adds someone. Archived people are
 * listed only while chosen.
 */
export function PersonPicker({
  people: loaded,
  value,
  onChange,
}: {
  people: ReadonlyArray<Person>
  value: string | null
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
    {
      value: ANONYMOUS,
      label: t('transactions.people.anonymous'),
      icon: <AnonymousAvatar count={1} size="sm" />,
    },
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
      label={t('transactions.people.source')}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('common.clear')}
      createLabel={(text) => t('common.createText', { text })}
      onCreate={create}
    />
  )
}

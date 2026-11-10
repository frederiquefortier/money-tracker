import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import { Combobox } from '#/components/combobox/combobox'
import { EventBadge } from '#/components/events/event-badge'
import { NewTypeSheet } from '#/components/events/form/new-type-sheet'
import { PersonAvatar } from '#/components/people/avatars'
import { PickField } from '#/components/events/form/pick-field'
import { groupTicks } from '#/components/forms/check-ticks'
import { usePeopleTree } from '#/hooks/transactions/use-check-trees'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { EventType } from '#/lib/events/event'
import type { Person, PersonGroup } from '#/lib/people/person'
import { byName } from '#/lib/shared/collections'

export type Ids = Array<string>

/** The type, optional; "Créer « … »" opens the type form over this one. */
export function TypeField({
  types,
  value,
  onChange,
}: {
  types: ReadonlyArray<EventType>
  value: string | null
  onChange: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const [creating, setCreating] = useState<string | null>(null)
  return (
    <>
      <Combobox
        label={t('events.type')}
        options={byName(types, locale).map((type) => ({
          value: type.id,
          label: type.name,
          icon: <EventBadge color={type.color} size="sm" />,
        }))}
        value={value}
        onChange={onChange}
        clearLabel={t('common.clear')}
        createLabel={(text) => t('common.createText', { text })}
        onCreate={setCreating}
      />
      {creating !== null && (
        <NewTypeSheet
          name={creating}
          onClosed={(id) => {
            setCreating(null)
            if (id) onChange(id)
          }}
        />
      )}
    </>
  )
}

export function PeoplePick({
  people,
  groups,
  picked,
  onChange,
}: {
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
  picked: ReadonlyArray<string>
  onChange: (ids: Ids) => void
}) {
  const { t } = useTranslation()
  return (
    <PickField
      label={t('events.people')}
      addLabel={t('events.choosePeople')}
      addIcon="user"
      picked={people
        .filter((p) => picked.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          icon: <PersonAvatar name={p.name} size="md" />,
        }))}
      onRemove={(id) => onChange(picked.filter((x) => x !== id))}
      onClear={() => onChange([])}
    >
      {(query) => (
        <PeopleChoices
          people={people}
          groups={groups}
          picked={picked}
          query={query}
          onChange={onChange}
        />
      )}
    </PickField>
  )
}

function PeopleChoices({
  people,
  groups,
  picked,
  query,
  onChange,
}: {
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
  picked: ReadonlyArray<string>
  query: string
  onChange: (ids: Ids) => void
}) {
  const { t } = useTranslation()
  // Archived people stay listed only while ticked, so a past guest is not lost.
  const listed = people.filter((p) => !p.archivedOn || picked.includes(p.id))
  const nodes = usePeopleTree(listed, groups, query)
  const ticks = groupTicks(picked)
  if (nodes.length === 0)
    return <p className="text-muted-foreground">{t('common.noMatch')}</p>
  return (
    <CheckList
      nodes={nodes}
      openCount={nodes.length}
      stateOf={ticks.stateOf}
      onToggle={(node) => onChange(ticks.toggle(node))}
    />
  )
}

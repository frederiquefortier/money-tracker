import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList } from '#/components/forms/check-list'
import { FormField } from '#/components/forms/form-field'
import { AliasList } from '#/components/forms/alias-list'
import { GroupAvatars, PersonAvatar } from '#/components/people/avatars'
import { CreateRow } from '#/components/forms/create-row'
import type { PeopleKind } from '#/components/people/list/people-actions'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useInlineCreate } from '#/hooks/forms/use-inline-create'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import { FieldLabel } from '#/components/ui/field'
import { byName } from '#/lib/shared/collections'
import { nameFormSchema } from '#/lib/shared/validation'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { saveGroup, savePerson } from '#/server/people'
import { useMarkChanged } from '#/hooks/forms/use-sheet'

type Named = { id: string; name: string; archivedOn: string | null }

/** A group listed in the person form carries its members' names, for its avatars. */
type Other = Named & { memberNames?: ReadonlyArray<string> }

/**
 * The other kind, ticked in the shared CheckList, whose last row creates one by name and
 * ticks it. Archived ones stay listed only while ticked, so a past membership is not lost.
 */
function LinkedList({
  kind,
  ids,
  others,
  onChange,
}: {
  kind: PeopleKind
  ids: ReadonlyArray<string>
  others: ReadonlyArray<Other>
  onChange: (update: (ids: Array<string>) => Array<string>) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const markChanged = useMarkChanged()
  const labelId = useId()
  const change = (update: (ids: Array<string>) => Array<string>) => {
    markChanged()
    onChange(update)
  }
  const { items, create } = useInlineCreate<Other>(others, {
    save: async (name) => {
      const result =
        kind === 'person'
          ? await saveGroup({ data: { name, memberIds: [] } })
          : await savePerson({ data: { name, groupIds: [], aliases: [] } })
      return result.ok
        ? { id: result.id, name, archivedOn: null, memberNames: [] }
        : null
    },
    onCreated: (item) => change((list) => [...list, item.id]),
  })
  const nodes = byName(
    items.filter((item) => !item.archivedOn || ids.includes(item.id)),
    locale,
  ).map((item) => ({
    id: item.id,
    label: item.name,
    icon:
      kind === 'group' ? (
        <PersonAvatar name={item.name} size="md" />
      ) : (
        <GroupAvatars names={item.memberNames ?? []} size="md" />
      ),
  }))

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <FieldLabel id={labelId}>
        {kind === 'person' ? t('people.groups') : t('people.members')}
      </FieldLabel>
      <CheckList
        nodes={nodes}
        stateOf={(node) => (ids.includes(node.id) ? 'on' : 'off')}
        onToggle={(node) =>
          change((list) =>
            list.includes(node.id)
              ? list.filter((id) => id !== node.id)
              : [...list, node.id],
          )
        }
      >
        <CreateRow
          label={
            kind === 'person' ? t('people.newGroup') : t('people.newPerson')
          }
          onCreate={create}
        />
      </CheckList>
    </div>
  )
}

/**
 * a person with their groups and aliases (PPL-06), or a group with its members.
 * `taken` is what an alias cannot repeat.
 */
export function PeopleForm({
  kind,
  row,
  linkedIds,
  others,
  aliases: initialAliases = [],
  taken = new Set(),
  savedText,
  children,
}: {
  kind: PeopleKind
  row: Named | null
  linkedIds: ReadonlyArray<string>
  others: ReadonlyArray<Other>
  aliases?: ReadonlyArray<string>
  taken?: ReadonlySet<string>
  savedText: string
  /** Read-only content after the fields: what the person owes. */
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  const [ids, setIds] = useState<Array<string>>([...linkedIds])
  const [aliases, setAliases] = useState<Array<string>>([...initialAliases])
  const form = useSheetForm({
    schema: nameFormSchema,
    initial: { name: row?.name ?? '' },
    save: (data) =>
      kind === 'person'
        ? savePerson({ data: { ...data, id: row?.id, groupIds: ids, aliases } })
        : saveGroup({ data: { ...data, id: row?.id, memberIds: ids } }),
    savedText,
  })

  return (
    <SheetForm {...form.formProps}>
      <FormField {...form.field('name')} label={t('people.name')} required />
      <LinkedList kind={kind} ids={ids} others={others} onChange={setIds} />
      {kind === 'person' && (
        <AliasList
          label={t('people.aliases')}
          newLabel={t('people.newAlias')}
          aliases={aliases}
          taken={taken}
          onChange={setAliases}
        />
      )}
      {children}
    </SheetForm>
  )
}

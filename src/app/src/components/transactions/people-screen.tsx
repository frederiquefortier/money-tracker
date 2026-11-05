import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckList, fieldCard } from '#/components/check-list'
import { CreateRow } from '#/components/create-row'
import { useSheetEscape } from '#/components/route-sheet'
import { SearchField } from '#/components/search-field'
import { ScreenHeader } from '#/components/transactions/category-screen'
import {
  groupTicks,
  usePeopleTree,
} from '#/components/transactions/filter-nodes'
import {
  AnonymousRow,
  Frequent,
} from '#/components/transactions/people-pick-rows'
import { useInlineCreate } from '#/components/use-inline-create'
import { SheetBody, SheetHead } from '#/components/ui/sheet'
import type { Person } from '#/lib/people'
import type { Draft } from '#/lib/transaction-draft'
import { withPeople, withoutPeople } from '#/lib/transaction-people'
import type { TransactionFormData } from '#/lib/transactions'
import { savePerson } from '#/server/people'

type Update = (changes: Partial<Draft>) => void
type Data = Pick<TransactionFormData, 'people' | 'groups' | 'frequentPeople'>

/** Who is ticked, ticking one or several, and a new person ticked at once. */
function usePeoplePick(draft: Draft, data: Data, onChange: Update) {
  const onIt = new Set(
    draft.people.flatMap((l) => (l.personId ? [l.personId] : [])),
  )
  const ticked = (id: string) => onIt.has(id)
  const { items: people, create } = useInlineCreate<Person>(data.people, {
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
    onCreated: (person) => onChange(withPeople(draft, [person.id])),
  })
  const toggle = (ids: ReadonlyArray<string>, on: boolean) =>
    onChange(on ? withoutPeople(draft, ids) : withPeople(draft, ids))
  return { people, ticked, toggle, create }
}

/**
 * Spec 20: who was there, over the whole sheet like the category list. Fréquents, then
 * the people grouped as in the list's filter (decided 2026-11-05): a card per group
 * with its members, "Sans groupe" for the others, flat while searching, each card's
 * "Tout" ticking its members. A new person and the people without a name follow in a
 * card of their own. Archived people and groups show only if already on it.
 */
export function PeopleScreen({
  draft,
  data,
  onChange,
  onBack,
}: {
  draft: Draft
  data: Data
  onChange: Update
  onBack: () => void
}) {
  const { t } = useTranslation()
  useSheetEscape(onBack)
  const [query, setQuery] = useState('')
  const { people, ticked, toggle, create } = usePeoplePick(
    draft,
    data,
    onChange,
  )
  const listed = people.filter((p) => !p.archivedOn || ticked(p.id))
  const tree = usePeopleTree(
    listed,
    data.groups.filter((g) => !g.archivedOn),
    query,
  )
  const picked = listed.filter((p) => ticked(p.id)).map((p) => p.id)
  const ticks = groupTicks(picked)

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-card">
      <ScreenHeader title={t('transactions.people.title')} onBack={onBack} />
      <SheetHead>
        <SearchField value={query} onChange={setQuery} autoFocus />
      </SheetHead>
      <SheetBody className="flex flex-col gap-3">
        {!query.trim() && (
          <Frequent
            people={data.frequentPeople.flatMap((id) => {
              const person = listed.find((p) => p.id === id && !p.archivedOn)
              return person ? [person] : []
            })}
            ticked={ticked}
            onToggle={(id) => toggle([id], ticked(id))}
          />
        )}
        <CheckList
          nodes={tree}
          openCount={tree.length}
          stateOf={ticks.stateOf}
          onToggle={(node) => {
            const next = ticks.toggle(node)
            const added = next.filter((id) => !picked.includes(id))
            if (added.length) onChange(withPeople(draft, added))
            else
              onChange(
                withoutPeople(
                  draft,
                  picked.filter((id) => !next.includes(id)),
                ),
              )
          }}
        />
        <div className={fieldCard}>
          <CreateRow
            label={t('transactions.people.newPerson')}
            onCreate={create}
          />
          <AnonymousRow draft={draft} onChange={onChange} />
        </div>
      </SheetBody>
    </div>
  )
}

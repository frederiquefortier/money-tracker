import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { PersonAvatar } from '#/components/people/avatars'
import type { Person } from '#/lib/people/person'
import {
  withHeadCount,
  withPeople,
  withoutLine,
} from '#/lib/transactions/transaction-people'
import { cn } from '#/lib/utils'
import { rowHover, focusRing, insetFocus } from '#/components/styles'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

// The people list's own rows (spec 20): Fréquents, and the count of people without a name.

type Update = (changes: Partial<TransactionDraft>) => void

/** The most frequent people as a row of avatars; a tap ticks or unticks one. */
export function FrequentPeople({
  people,
  ticked,
  onToggle,
}: {
  people: ReadonlyArray<Person>
  ticked: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  const { t } = useTranslation()
  if (people.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-muted-foreground">
        {t('transactions.people.frequent')}
      </h3>
      <ul className={cn('flex gap-1 overflow-x-auto', insetFocus)}>
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              aria-pressed={ticked(person.id)}
              onClick={() => onToggle(person.id)}
              className={cn(
                'flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-xs',
                rowHover,
                ticked(person.id) && 'bg-accent font-semibold',
                focusRing,
              )}
            >
              <PersonAvatar name={person.name} />
              <span className="w-full truncate px-0.5 text-center">
                {person.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * PPL-04: how many people without a name, as a count with − and +, so a tap shows at
 * once. 0 removes the line; it counts the first such line (others are on the slip).
 */
export function AnonymousRow({
  draft,
  onChange,
}: {
  draft: TransactionDraft
  onChange: Update
}) {
  const { t } = useTranslation()
  const line = draft.people.find((l) => l.role !== 'me' && !l.personId)
  const count = line?.headCount ?? 0
  const set = (next: number) => {
    if (!line) onChange(withPeople(draft, [null]))
    else if (next === 0) onChange(withoutLine(draft, line.key))
    else onChange(withHeadCount(draft, line.key, next))
  }
  return (
    <div className="flex min-h-12 items-center gap-3 border-t px-3 first:border-t-0">
      <span className="min-w-0 flex-1 truncate font-medium">
        {t('transactions.people.anonymous')}
      </span>
      <IconButton
        icon="minus"
        label={t('transactions.people.fewer')}
        disabled={count === 0}
        onClick={() => set(count - 1)}
      />
      <span className="w-6 text-center font-semibold tabular-nums">
        {count}
      </span>
      <IconButton
        icon="plus"
        label={t('transactions.people.more')}
        onClick={() => set(count + 1)}
      />
    </div>
  )
}

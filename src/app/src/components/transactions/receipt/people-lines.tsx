import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { chipSurface, focusRing } from '#/components/styles'
import { FieldMessage } from '#/components/forms/form-field'
import { Icon } from '#/components/display/icon'
import { EditHint } from '#/components/forms/edit-hint'
import { IconButton } from '#/components/display/icon-button'
import { AnonymousAvatar, PersonAvatar } from '#/components/people/avatars'
import { SplitRemaining } from '#/components/transactions/receipt/receipt-remaining'
import { ModeLine } from '#/components/transactions/receipt/receipt-splits'
import {
  BackLines,
  LinePart,
} from '#/components/transactions/receipt/people-line-parts'
import { slipRule } from '#/components/transactions/receipt/receipt-line'
import type { Person } from '#/lib/people/person'
import {
  withHeadCount,
  withPeopleMode,
  withRoleSwitched,
  withoutLine,
  isUnknown,
} from '#/lib/transactions/transaction-people'
import {
  peoplePreview,
  typedLeft,
} from '#/lib/transactions/transaction-people-draft'
import type { PersonLine } from '#/lib/transactions/transaction-people'
import { cn } from '#/lib/utils'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

type Update = (changes: Partial<TransactionDraft>) => void

const avatarBox =
  'grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary'

/** Moi is the person icon (spec 20); a line without a name, the person or group icon. */
function LineAvatar({ line, name }: { line: PersonLine; name: string }) {
  if (line.role === 'me')
    return (
      <span aria-hidden="true" className={avatarBox}>
        <Icon name="user" className="size-4" />
      </span>
    )
  if (line.personId === null)
    return <AnonymousAvatar count={line.headCount} size="md" />
  return <PersonAvatar name={name} size="md" />
}

/** The role bubble on an expense, or the count of a line without a name. */
function LineControls({
  line,
  name,
  draft,
  onChange,
}: {
  line: PersonLine
  name: string
  draft: TransactionDraft
  onChange: Update
}) {
  const { t } = useTranslation()
  // Only an expense's lines have controls: an income's one source is a field.
  if (line.role === 'me' || line.role === 'from') return null
  const count = line.personId === null && (
    <span className="flex items-center">
      <IconButton
        icon="minus"
        label={t('transactions.people.fewer')}
        disabled={line.headCount <= 1}
        onClick={() =>
          onChange(withHeadCount(draft, line.key, line.headCount - 1))
        }
      />
      <IconButton
        icon="plus"
        label={t('transactions.people.more')}
        onClick={() =>
          onChange(withHeadCount(draft, line.key, line.headCount + 1))
        }
      />
    </span>
  )
  const role = t(`transactions.people.roles.${line.role}`)
  // The count first, so its − and + read as people, not as the amount.
  return (
    <span className="flex shrink-0 items-center gap-1">
      {count}
      <button
        type="button"
        aria-label={t('transactions.people.roleLabel', { name, role })}
        onClick={() => onChange(withRoleSwitched(draft, line.key))}
        className={cn(chipSurface, 'h-7 px-2.5 font-sans text-xs')}
      >
        {role}
      </button>
    </span>
  )
}

function lineName(
  line: PersonLine,
  people: ReadonlyArray<Person>,
  t: TFunction,
) {
  if (line.role === 'me') return t('transactions.people.me')
  if (line.personId === null)
    return t('transactions.people.count', { count: line.headCount })
  return people.find((p) => p.id === line.personId)?.name ?? ''
}

function PeopleLine({
  line,
  draft,
  people,
  computed,
  filled,
  accountCurrency,
  onChange,
}: {
  line: PersonLine
  draft: TransactionDraft
  people: ReadonlyArray<Person>
  computed: bigint | null | undefined
  filled: boolean
  accountCurrency: string
  onChange: Update
}) {
  const { t } = useTranslation()
  const name = lineName(line, people, t)
  return (
    <li className="flex flex-col gap-1 text-sm">
      <div className="flex items-start gap-2">
        <LineAvatar line={line} name={name} />
        {/* The role on the name's line, on its right; a long name ends with "…". */}
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 flex-1 truncate leading-8">{name}</span>
          <LineControls
            line={line}
            name={name}
            draft={draft}
            onChange={onChange}
          />
        </span>
        <LinePart
          {...{
            line,
            name,
            draft,
            computed,
            filled,
            accountCurrency,
            onChange,
          }}
        />
        {line.role === 'me' ? (
          <span aria-hidden="true" className="size-8 shrink-0" />
        ) : (
          <IconButton
            icon="close"
            label={t('transactions.removeLine')}
            onClick={() => onChange(withoutLine(draft, line.key))}
          />
        )}
      </div>
      <BackLines
        line={line}
        unknown={isUnknown(line)}
        computed={computed}
        accountCurrency={accountCurrency}
      />
    </li>
  )
}

/** Adds someone: an empty dashed circle with a plus, as for a category (spec 20). */
function AddPerson({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  const label = t('transactions.people.add')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      title={label}
      className={cn('group self-start rounded-full', focusRing)}
    >
      <span className="relative block">
        <span className="grid size-8 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary/60 transition-colors group-hover:border-primary group-focus-visible:border-primary">
          <Icon name="user" className="size-4" />
        </span>
        <EditHint size="xs" icon="plus" />
      </span>
    </button>
  )
}

/**
 * PPL-03, 04 (spec 20): the people's parts on the slip after a rule, like the splits.
 * Moi first on an expense; each person with their role; a line without a name with its
 * count. The round add button is always last, alone while no one is on it.
 */
export function PeopleLines({
  draft,
  people,
  total,
  accountCurrency,
  error,
  onChange,
  onOpen,
}: {
  draft: TransactionDraft
  people: ReadonlyArray<Person>
  total: bigint | null
  accountCurrency: string
  error: string | undefined
  onChange: Update
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const { amounts, remaining, filled } = peoplePreview(
    draft,
    total,
    accountCurrency,
  )
  if (draft.people.length === 0)
    return (
      <>
        {slipRule}
        <AddPerson onOpen={onOpen} />
      </>
    )
  return (
    <>
      {slipRule}
      <ModeLine
        value={draft.peopleMode}
        label={t('transactions.people.splitBy')}
        idPrefix="people"
        onSelect={(mode) => onChange(withPeopleMode(draft, mode))}
      />
      <ul className="flex flex-col gap-2">
        {draft.people.map((line, i) => (
          <PeopleLine
            key={line.key}
            {...{ line, draft, people, accountCurrency, onChange }}
            computed={amounts[i]}
            filled={filled.has(line.key)}
          />
        ))}
      </ul>
      <AddPerson onOpen={onOpen} />
      {(remaining !== null || draft.peopleMode === 'percent') &&
        draft.peopleMode !== 'share' && (
          <SplitRemaining
            mode={draft.peopleMode}
            values={draft.people.map((l) => l.value)}
            remaining={typedLeft(draft, total, accountCurrency)}
            accountCurrency={accountCurrency}
          />
        )}
      {error && <FieldMessage>{error}</FieldMessage>}
    </>
  )
}

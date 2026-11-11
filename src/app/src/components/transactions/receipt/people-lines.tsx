import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FieldMessage } from '#/components/forms/form-field'
import { Icon } from '#/components/display/icon'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { IconButton } from '#/components/display/icon-button'
import { AnonymousAvatar, PersonAvatar } from '#/components/people/avatars'
import { SplitRemaining } from '#/components/transactions/receipt/receipt-remaining'
import { ModeLine } from '#/components/transactions/receipt/receipt-splits'
import {
  AddPerson,
  BackLines,
  LinePart,
} from '#/components/transactions/receipt/people-line-parts'
import { slipRule } from '#/components/transactions/receipt/receipt-line'
import type { Person } from '#/lib/people/person'
import {
  withHeadCount,
  withPeopleMode,
  withRole,
  GUEST_ROLES,
  withoutPersonLine,
  isUnknown,
} from '#/lib/transactions/transaction-people'
import {
  moneyValues,
  peoplePreview,
  typedLeft,
} from '#/lib/transactions/transaction-people-draft'
import type { PersonLine } from '#/lib/transactions/transaction-people'
import type {
  DraftUpdate,
  TransactionDraft,
} from '#/lib/transactions/transaction-draft-types'

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
  onChange: DraftUpdate
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
  return (
    <span className="flex shrink-0 items-center gap-1">
      {count}
      <ChoiceMenu
        label={t('transactions.people.roleLabel', { name, role })}
        className="h-7 px-2.5 font-sans text-xs"
        value={line.role}
        options={line.personId === null ? GUEST_ROLES.slice(0, 2) : GUEST_ROLES}
        labelOf={(r) => t(`transactions.people.roles.${r}`)}
        onChange={(next) => onChange(withRole(draft, line.key, next))}
      />
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
  onChange: DraftUpdate
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
            onClick={() => onChange(withoutPersonLine(draft, line.key))}
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
  onChange: DraftUpdate
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
            values={moneyValues(draft)}
            remaining={typedLeft(draft, total, accountCurrency)}
            accountCurrency={accountCurrency}
          />
        )}
      {error && <FieldMessage>{error}</FieldMessage>}
    </>
  )
}

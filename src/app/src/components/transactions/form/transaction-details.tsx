import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChoiceField } from '#/components/forms/choice-field'
import { LinkedFields } from '#/components/forms/linked-fields'
import { EventPicker } from '#/components/events/event-picker'
import { HoldingPicker } from '#/components/holdings/holding-picker'
import { isInvestmentDraft } from '#/lib/holdings/holding-link'
import { MerchantPicker } from '#/components/merchants/merchant-picker'
import { PersonPicker } from '#/components/people/person-picker'
import { ReimbursesField } from '#/components/transactions/form/reimburses-field'
import {
  AccountPicker,
  DateField,
  NoteField,
} from '#/components/transactions/entry/entry-fields'
import type { Merchant } from '#/lib/merchants/merchant'
import { withMerchant } from '#/lib/transactions/transaction-draft'
import { sourceOf, withSource } from '#/lib/transactions/transaction-source'
import type {
  FormAccount,
  TransactionFormData,
} from '#/lib/transactions/transaction'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'

/** The currency follows the account, unless another one was chosen. */
function accountChanges(
  draft: TransactionDraft,
  account: FormAccount | null,
  currentCurrency: string | undefined,
): Partial<TransactionDraft> {
  const follows = draft.currency === (currentCurrency ?? draft.currency)
  return {
    accountId: account?.id ?? null,
    ...(account && follows
      ? { currency: account.currency, paid: '', paidByHand: false }
      : {}),
  }
}

/** MER-01: a merchant's default fills a category not chosen by hand, never splits. */
function merchantChanges(
  draft: TransactionDraft,
  merchant: Merchant | null,
  categories: TransactionFormData['categories'],
): Partial<TransactionDraft> {
  if (!merchant) return { merchantId: null }
  if (draft.categoryByHand || draft.splitMode !== null)
    return { merchantId: merchant.id }
  // An expense's default category never fills an income, such as a returned item.
  return withMerchant(
    merchant,
    categories.filter((c) => c.kind === draft.kind),
  )
}

type DetailsProps = {
  /** The transaction's id when editing, for an income's reimbursements. */
  id?: string
  draft: TransactionDraft
  data: TransactionFormData
  error: (name: string) => string | undefined
  onChange: (changes: Partial<TransactionDraft>) => void
}

const WHERE = ['store', 'person', 'holding'] as const
type Where = (typeof WHERE)[number]

function initialWhere(draft: TransactionDraft, person: string | null): Where {
  if (draft.holdingId) return 'holding'
  return person ? 'person' : 'store'
}

const TAB_LABELS = {
  store: 'transactions.merchant',
  person: 'transactions.people.source',
  holding: 'holdings.field',
} as const

/** The field behind the toggle's choice. */
function WhereField({
  where,
  draft,
  data,
  onChange,
}: Pick<DetailsProps, 'draft' | 'data' | 'onChange'> & { where: Where }) {
  const income = draft.kind === 'income'
  if (where === 'holding')
    return (
      <HoldingPicker
        hideLabel
        holdings={data.holdings}
        value={draft.holdingId}
        date={draft.occurredOn}
        onChange={(holdingId) => onChange({ holdingId })}
      />
    )
  if (where === 'person')
    return (
      <PersonPicker
        hideLabel
        people={data.people}
        value={income ? sourceOf(draft) : draft.sellerId}
        anonymous={income}
        onChange={(personId) =>
          onChange(
            income
              ? { ...withSource(personId), reimburses: [] }
              : { sellerId: personId },
          )
        }
      />
    )
  return (
    <MerchantPicker
      hideLabel
      merchants={data.merchants}
      value={draft.merchantId}
      onChange={(merchant) =>
        onChange(merchantChanges(draft, merchant, data.categories))
      }
    />
  )
}

/**
 * A store, a person or a holding, one of the three: where an expense was bought (PPL-08),
 * who an income came from, or the holding an investment pays into or out of (NW-03). The
 * toggle only decides which field shows; switching clears the other sides. The holding
 * only offers itself on an investment category.
 */
function StoreOrPerson({
  id,
  draft,
  data,
  onChange,
}: Pick<DetailsProps, 'id' | 'draft' | 'data' | 'onChange'>) {
  const { t } = useTranslation()
  const income = draft.kind === 'income'
  const label = t('transactions.linkedTo')
  const person = income ? sourceOf(draft) : draft.sellerId
  const investment = isInvestmentDraft(draft, data.categories)
  const [chosen, setWhere] = useState<Where>(initialWhere(draft, person))
  const where: Where = chosen === 'holding' && !investment ? 'store' : chosen
  const options = investment ? WHERE : WHERE.filter((tab) => tab !== 'holding')
  const clearPerson = income
    ? { ...withSource(null), reimburses: [] }
    : { sellerId: null }
  const select = (next: Where) => {
    setWhere(next)
    if (next === 'store') onChange({ ...clearPerson, holdingId: null })
    else if (next === 'person') onChange({ merchantId: null, holdingId: null })
    else onChange({ ...clearPerson, merchantId: null })
  }
  return (
    <>
      <ChoiceField
        label={label}
        options={options.map((tab) => ({
          value: tab,
          label: t(TAB_LABELS[tab]),
        }))}
        value={where}
        onChange={select}
      />
      <LinkedFields>
        <div className="contents">
          <WhereField where={where} {...{ draft, data, onChange }} />
        </div>
      </LinkedFields>
      {income && where === 'person' && (
        <ReimbursesField
          id={id}
          draft={draft}
          categories={data.categories}
          onChange={onChange}
        />
      )}
    </>
  )
}

/**
 * Under the receipt: the store, full width, which can fill the category
 * (MER-01), and who it was bought from (PPL-08), or on an income who it came from; the account, the date, the note.
 */
export function TransactionDetails({
  id,
  draft,
  data,
  error,
  onChange,
}: DetailsProps) {
  const currentCurrency = data.accounts.find(
    (a) => a.id === draft.accountId,
  )?.currency

  return (
    <>
      <StoreOrPerson {...{ id, draft, data, onChange }} />
      <AccountPicker
        accounts={data.accounts}
        value={draft.accountId}
        error={error('accountId')}
        onChange={(account) =>
          onChange(accountChanges(draft, account, currentCurrency))
        }
      />
      <DateField
        date={draft.occurredOn}
        error={error('occurredOn')}
        onChange={(occurredOn) => onChange({ occurredOn })}
      />
      <EventPicker
        events={data.events}
        types={data.eventTypes}
        value={draft.eventId}
        auto={draft.eventChoice === 'auto'}
        onChange={(eventId) =>
          onChange({
            eventId,
            eventChoice: eventId === null ? 'none' : 'manual',
          })
        }
      />
      <NoteField value={draft.note} onChange={(note) => onChange({ note })} />
    </>
  )
}

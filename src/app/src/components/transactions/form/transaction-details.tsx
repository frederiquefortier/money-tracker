import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldLabel } from '#/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { LinkedFields } from '#/components/forms/linked-fields'
import { EventPicker } from '#/components/events/event-picker'
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

const WHERE = ['store', 'person'] as const
type Where = (typeof WHERE)[number]

/**
 * A store or a person, one or the other: where an expense was bought (PPL-08) or who an
 * income came from (spec 20). The toggle only decides which field shows; switching clears
 * the other side.
 */
function StoreOrPerson({
  id,
  draft,
  data,
  onChange,
}: Pick<DetailsProps, 'id' | 'draft' | 'data' | 'onChange'>) {
  const { t } = useTranslation()
  const labelId = useId()
  const income = draft.kind === 'income'
  const label = t(
    income ? 'transactions.receivedFrom' : 'transactions.boughtFrom',
  )
  const person = income ? sourceOf(draft) : draft.sellerId
  const [where, setWhere] = useState<Where>(person ? 'person' : 'store')
  const select = (next: Where) => {
    setWhere(next)
    if (next === 'person') onChange({ merchantId: null })
    else
      onChange(
        income ? { ...withSource(null), reimburses: [] } : { sellerId: null },
      )
  }
  return (
    <>
      <div className="flex flex-col gap-2">
        <FieldLabel id={labelId}>{label}</FieldLabel>
        <ToggleGroup
          type="single"
          aria-labelledby={labelId}
          value={where}
          // Pressing the chosen item again would clear it: one side is always chosen.
          onValueChange={(next) => next && select(next as Where)}
        >
          {WHERE.map((tab) => (
            <ToggleGroupItem key={tab} value={tab}>
              {tab === 'store'
                ? t('transactions.merchant')
                : t('transactions.people.source')}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <LinkedFields>
        <div className="contents">
          {where === 'store' ? (
            <MerchantPicker
              hideLabel
              merchants={data.merchants}
              value={draft.merchantId}
              onChange={(merchant) =>
                onChange(merchantChanges(draft, merchant, data.categories))
              }
            />
          ) : (
            <PersonPicker
              hideLabel
              people={data.people}
              value={person}
              anonymous={income}
              onChange={(personId) =>
                onChange(
                  income
                    ? { ...withSource(personId), reimburses: [] }
                    : { sellerId: personId },
                )
              }
            />
          )}
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
 * Spec 15, under the receipt: the store, full width, which can fill the category
 * (MER-01), and who it was bought from (PPL-08), or on an income who it came from (spec 20); the account, the date, the note.
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

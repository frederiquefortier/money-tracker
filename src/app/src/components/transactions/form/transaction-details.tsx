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
  return withMerchant(merchant, categories)
}

type DetailsProps = {
  /** The transaction's id when editing, for an income's reimbursements. */
  id?: string
  draft: TransactionDraft
  data: TransactionFormData
  error: (name: string) => string | undefined
  onChange: (changes: Partial<TransactionDraft>) => void
}

/**
 * Spec 15, under the receipt: the store, full width, which can fill the category
 * (MER-01), or on an income who it came from (spec 20); the account, the date, the note.
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
      {draft.kind === 'income' ? (
        <>
          <PersonPicker
            people={data.people}
            value={sourceOf(draft)}
            onChange={(personId) =>
              onChange({ ...withSource(personId), reimburses: [] })
            }
          />
          <ReimbursesField
            id={id}
            draft={draft}
            categories={data.categories}
            onChange={onChange}
          />
        </>
      ) : (
        <MerchantPicker
          merchants={data.merchants}
          value={draft.merchantId}
          onChange={(merchant) =>
            onChange(merchantChanges(draft, merchant, data.categories))
          }
        />
      )}
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
      <NoteField value={draft.note} onChange={(note) => onChange({ note })} />
    </>
  )
}

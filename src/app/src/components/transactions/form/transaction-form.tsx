import { useActionState, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SheetForm } from '#/components/sheet/sheet-form'
import { CategoryScreen } from '#/components/transactions/form/category-screen'
import { EntryTabs } from '#/components/transactions/entry/entry-tabs'
import { ReceiptAmount } from '#/components/transactions/receipt/receipt-amount'
import { PeopleScreen } from '#/components/transactions/form/people-screen'
import { TransactionDetails } from '#/components/transactions/form/transaction-details'
import type { FieldErrors } from '#/lib/forms/form-state'
import { validateDraft, withPicked } from '#/lib/transactions/transaction-draft'
import { peopleForKind } from '#/lib/transactions/transaction-source'
import type {
  FormAccount,
  TransactionFormData,
} from '#/lib/transactions/transaction'
import { useMatchedEvent } from '#/hooks/transactions/use-matched-event'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { useRate } from '#/hooks/currencies/use-rate'
import { saveTransaction } from '#/server/transactions'
import { useToast } from '#/hooks/app/use-toast'
import {
  useFocusFirstError,
  useValidationMessage,
} from '#/hooks/forms/use-validation'
import { useCloseSheet, useMarkChanged } from '#/hooks/forms/use-sheet'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'
import type { PickTarget } from '#/components/transactions/receipt/receipt-line'

type State = { errors: FieldErrors; failed: boolean; submitted: boolean }

/** The draft, the account it books on, and that day's rate when the currencies differ. */
function useDraft(
  initial: TransactionDraft,
  accounts: ReadonlyArray<FormAccount>,
) {
  const markChanged = useMarkChanged()
  const [draft, setDraft] = useState(initial)
  const account = accounts.find((a) => a.id === draft.accountId)
  const accountCurrency = account?.currency ?? null
  const rate = useRate(draft.currency, accountCurrency ?? '', draft.occurredOn)
  function update(changes: Partial<TransactionDraft>) {
    markChanged()
    setDraft((d) => ({ ...d, ...changes }))
  }
  // The rule's answer is not an edit: it must not mark the form changed.
  const setEvent = (eventId: string | null) =>
    setDraft((d) => (d.eventId === eventId ? d : { ...d, eventId }))
  return { draft, update, setEvent, accountCurrency, rate }
}

function useSubmit({
  check,
  savedText,
  onSaved,
}: {
  check: () => ReturnType<typeof validateDraft>
  savedText: string
  onSaved?: (accountId: string) => void
}) {
  const toast = useToast()
  const closeSheet = useCloseSheet()
  return useActionState(
    async (): Promise<State> => {
      const { input, errors } = check()
      if (!input) return { errors, failed: false, submitted: true }
      const result = await saveTransaction({ data: input }).catch(() => null)
      if (!result?.ok) return { errors: {}, failed: true, submitted: true }
      onSaved?.(input.accountId)
      toast({ text: savedText })
      closeSheet()
      return { errors: {}, failed: false, submitted: true }
    },
    { errors: {}, failed: false, submitted: false },
  )
}

/** What is open over the form: the category list for a target, or the people list. */
type Layer = PickTarget | 'people'

/** The category list or the people list, over the whole form while open. */
function Layers({
  layer,
  draft,
  data,
  onChange,
  onClose,
}: {
  layer: Layer | null
  draft: TransactionDraft
  data: TransactionFormData
  onChange: (changes: Partial<TransactionDraft>) => void
  onClose: () => void
}) {
  if (layer === 'people')
    return (
      <PeopleScreen
        draft={draft}
        data={data}
        onChange={onChange}
        onBack={onClose}
      />
    )
  if (layer === null) return null
  return (
    <CategoryScreen
      categories={data.categories}
      kind={draft.kind}
      frequent={data.frequent}
      date={draft.occurredOn}
      onPick={(categoryId) => {
        onChange(withPicked(draft, layer, categoryId))
        onClose()
      }}
      onBack={onClose}
    />
  )
}

const receiptErrors = (error: (name: string) => string | undefined) => ({
  amount: error('amount'),
  category: error('categoryId'),
  paid: error('paid'),
  splits: error('splits'),
  people: error('people'),
})

/**
 * an expense or income, new (`id` undefined) or edited. A category's round
 * icon, on the receipt or a split line, opens the category list over the whole sheet;
 * the form stays as it was underneath. `onTransfer` offers the Transfert tab,
 * handing over what was typed.
 */
export function TransactionForm({
  id,
  initial,
  data,
  savedText,
  onSaved,
  onTransfer,
}: {
  id?: string
  initial: TransactionDraft
  data: TransactionFormData
  savedText: string
  onSaved?: (accountId: string) => void
  onTransfer?: (draft: TransactionDraft) => void
}) {
  const { t } = useTranslation()
  const message = useValidationMessage()
  const { currencies } = useMyCurrencies()
  const panelId = useId()
  const [layer, setLayer] = useState<Layer | null>(null)
  const { draft, update, setEvent, accountCurrency, rate } = useDraft(
    initial,
    data.accounts,
  )
  useMatchedEvent(draft, id, setEvent)
  const check = () =>
    validateDraft(draft, { id, accountCurrency, rate: rate ?? null })
  const [state, submit, pending] = useSubmit({ check, savedText, onSaved })
  // After a first submit, errors follow the fields as they are corrected.
  const errors = state.submitted ? (check().errors ?? {}) : {}
  const error = (name: string) => message(errors[name])
  const formRef = useFocusFirstError(state.errors)

  return (
    <SheetForm
      action={submit}
      formRef={formRef}
      pending={pending}
      error={state.failed && t('common.saveFailed')}
    >
      <Layers
        layer={layer}
        draft={draft}
        data={data}
        onChange={update}
        onClose={() => setLayer(null)}
      />
      <EntryTabs
        kind={draft.kind}
        tabs={onTransfer ? undefined : ['expense', 'income']}
        panelId={panelId}
        onChange={(kind) =>
          kind === 'transfer'
            ? onTransfer?.(draft)
            : update({
                kind,
                ...peopleForKind(draft, kind),
                // An income names who it came from instead of a seller.
                ...(kind === 'income' ? { sellerId: null } : {}),
              })
        }
      />
      <div id={panelId} className="flex flex-col gap-5">
        <ReceiptAmount
          draft={draft}
          categories={data.categories}
          accountCurrency={accountCurrency}
          currencies={currencies}
          rate={rate}
          errors={receiptErrors(error)}
          people={data.people}
          autoFocus={id === undefined}
          onChange={update}
          onPick={setLayer}
          onOpenPeople={() => setLayer('people')}
        />
        <TransactionDetails {...{ id, draft, data, error }} onChange={update} />
      </div>
    </SheetForm>
  )
}

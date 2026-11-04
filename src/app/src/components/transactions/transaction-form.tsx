import { useActionState, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloseSheet, useMarkChanged } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { TabList } from '#/components/tab-list'
import { useToast } from '#/components/toaster'
import {
  AmountField,
  ForeignFields,
} from '#/components/transactions/amount-fields'
import { Details } from '#/components/transactions/transaction-details'
import type { Category } from '#/lib/categories'
import { useFocusFirstError, useValidationMessage } from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import type { Merchant } from '#/lib/merchants'
import { validateDraft } from '#/lib/transaction-draft'
import type { Draft } from '#/lib/transaction-draft'
import { bookedMinor } from '#/lib/transaction-preview'
import type { FormAccount } from '#/lib/transactions'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { useRate } from '#/lib/use-rate'
import type { FrequentCategories } from '#/server/transactions'
import { saveTransaction } from '#/server/transactions'

export type TransactionFormData = {
  accounts: Array<FormAccount>
  categories: Array<Category>
  merchants: Array<Merchant>
  frequent: FrequentCategories
}

// Shared with the details, which take the same loader data.
type State = { errors: FieldErrors; failed: boolean; submitted: boolean }

const TABS = ['expense', 'income', 'transfer'] as const

/** The draft, the account it books on, and that day's rate when the currencies differ. */
function useDraft(initial: Draft, accounts: ReadonlyArray<FormAccount>) {
  const markChanged = useMarkChanged()
  const [draft, setDraft] = useState(initial)
  const account = accounts.find((a) => a.id === draft.accountId)
  const accountCurrency = account?.currency ?? null
  const rate = useRate(draft.currency, accountCurrency ?? '', draft.occurredOn)
  function update(changes: Partial<Draft>) {
    markChanged()
    setDraft((d) => ({ ...d, ...changes }))
  }
  return {
    draft,
    update,
    accountCurrency,
    rate: rate ?? null,
    loading: rate === undefined,
  }
}

function useSubmit({
  check,
  onSaved,
}: {
  check: () => ReturnType<typeof validateDraft>
  onSaved: (accountId: string) => void
}) {
  const closeSheet = useCloseSheet()
  return useActionState(
    async (): Promise<State> => {
      const { input, errors } = check()
      if (!input) return { errors, failed: false, submitted: true }
      const result = await saveTransaction({ data: input }).catch(() => null)
      if (!result?.ok) return { errors: {}, failed: true, submitted: true }
      onSaved(input.accountId)
      closeSheet()
      return { errors: {}, failed: false, submitted: true }
    },
    { errors: {}, failed: false, submitted: false },
  )
}

/** Spec 15: an expense or income, new (`id` undefined) or edited. */
export function TransactionForm({
  id,
  initial,
  data,
  onSaved,
}: {
  id?: string
  initial: Draft
  data: TransactionFormData
  onSaved: (accountId: string) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const message = useValidationMessage()
  const { currencies } = useMyCurrencies()
  const panelId = useId()
  const { draft, update, accountCurrency, rate } = useDraft(
    initial,
    data.accounts,
  )
  const check = () => validateDraft(draft, { id, accountCurrency, rate })
  const [state, submit, pending] = useSubmit({ check, onSaved })
  // After a first submit, errors follow the fields as they are corrected.
  const errors = state.submitted ? (check().errors ?? {}) : {}
  const error = (name: string) => message(errors[name])
  const formRef = useFocusFirstError(state.errors)
  const foreign = accountCurrency !== null && draft.currency !== accountCurrency

  return (
    <SheetForm
      action={submit}
      formRef={formRef}
      pending={pending}
      error={state.failed && t('common.saveFailed')}
    >
      <TabList
        label={t('transactions.kindsLabel')}
        tabs={TABS}
        value={draft.kind}
        labelOf={(k) => t(`transactions.kinds.${k}`)}
        panelId={panelId}
        idPrefix="kind"
        muted={(k) => k === 'transfer'}
        onSelect={(k) =>
          k === 'transfer'
            ? toast({ text: t('transactions.transferSoon') })
            : update({ kind: k })
        }
      />
      <div id={panelId} className="flex flex-col gap-5">
        <AmountField
          draft={draft}
          currencies={currencies}
          error={error('amount')}
          autoFocus={id === undefined}
          onChange={update}
        />
        {foreign && (
          <ForeignFields
            draft={draft}
            accountCurrency={accountCurrency}
            rate={rate}
            error={error('paid')}
            onChange={update}
          />
        )}
        <Details
          draft={draft}
          data={data}
          accountCurrency={accountCurrency}
          total={
            accountCurrency ? bookedMinor(draft, accountCurrency, rate) : null
          }
          error={error}
          onChange={update}
        />
      </div>
    </SheetForm>
  )
}

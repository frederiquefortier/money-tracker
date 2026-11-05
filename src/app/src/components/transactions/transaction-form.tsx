import { useActionState, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloseSheet, useMarkChanged } from '#/components/route-sheet'
import { SheetForm } from '#/components/sheet-form'
import { useToast } from '#/components/toaster'
import { TabList } from '#/components/tab-list'
import { CategoryScreen } from '#/components/transactions/category-screen'
import { ReceiptAmount } from '#/components/transactions/receipt-amount'
import type { PickTarget } from '#/components/transactions/receipt-amount'
import { Details } from '#/components/transactions/transaction-details'
import { useFocusFirstError, useValidationMessage } from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import { validateDraft, withPicked } from '#/lib/transaction-draft'
import type { Draft } from '#/lib/transaction-draft'
import type { FormAccount, TransactionFormData } from '#/lib/transactions'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { useRate } from '#/lib/use-rate'
import { saveTransaction } from '#/server/transactions'

type State = { errors: FieldErrors; failed: boolean; submitted: boolean }

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
  return { draft, update, accountCurrency, rate }
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

const TABS = ['expense', 'income', 'transfer'] as const

/** The kind first (spec 15); Transfert waits for spec 16 and says so. */
function KindTabs({
  kind,
  panelId,
  onChange,
}: {
  kind: Draft['kind']
  panelId: string
  onChange: (kind: Draft['kind']) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  return (
    <TabList
      label={t('transactions.kindsLabel')}
      tabs={TABS}
      value={kind}
      labelOf={(k) => t(`transactions.kinds.${k}`)}
      panelId={panelId}
      idPrefix="kind"
      muted={(k) => k === 'transfer'}
      onSelect={(k) =>
        k === 'transfer'
          ? toast({ text: t('transactions.transferSoon') })
          : onChange(k)
      }
    />
  )
}

/**
 * Spec 15: an expense or income, new (`id` undefined) or edited. A category's round
 * icon, on the receipt or a split line, opens the category list over the whole sheet;
 * the form stays as it was underneath.
 */
export function TransactionForm({
  id,
  initial,
  data,
  savedText,
  onSaved,
}: {
  id?: string
  initial: Draft
  data: TransactionFormData
  savedText: string
  onSaved?: (accountId: string) => void
}) {
  const { t } = useTranslation()
  const message = useValidationMessage()
  const { currencies } = useMyCurrencies()
  const panelId = useId()
  const [picking, setPicking] = useState<PickTarget | null>(null)
  const { draft, update, accountCurrency, rate } = useDraft(
    initial,
    data.accounts,
  )
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
      {picking !== null && (
        <CategoryScreen
          categories={data.categories}
          kind={draft.kind}
          frequent={data.frequent}
          date={draft.occurredOn}
          onPick={(category) => {
            update(withPicked(draft, picking, category.id))
            setPicking(null)
          }}
          onBack={() => setPicking(null)}
        />
      )}
      <KindTabs
        kind={draft.kind}
        panelId={panelId}
        onChange={(kind) => update({ kind })}
      />
      <div id={panelId} className="flex flex-col gap-5">
        <ReceiptAmount
          draft={draft}
          categories={data.categories}
          accountCurrency={accountCurrency}
          currencies={currencies}
          rate={rate}
          errors={{
            amount: error('amount'),
            category: error('categoryId'),
            paid: error('paid'),
            splits: error('splits'),
          }}
          autoFocus={id === undefined}
          onChange={update}
          onPick={setPicking}
        />
        <Details draft={draft} data={data} error={error} onChange={update} />
      </div>
    </SheetForm>
  )
}

import { useActionState, useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SheetForm } from '#/components/sheet/sheet-form'
import {
  AccountPicker,
  DateField,
  NoteField,
} from '#/components/transactions/entry/entry-fields'
import { EntryTabs } from '#/components/transactions/entry/entry-tabs'
import type { EntryKind } from '#/components/transactions/entry/entry-tabs'
import { TransferReceipt } from '#/components/transactions/entry/transfer-receipt'
import { SheetBody } from '#/components/ui/sheet'
import type { FieldErrors } from '#/lib/forms/form-state'
import { validateTransfer } from '#/lib/transfers/transfer-draft'
import type { TransferDraft } from '#/lib/transfers/transfer-draft'
import type { TransactionFormData } from '#/lib/transactions/transaction'
import { useRate } from '#/hooks/currencies/use-rate'
import { saveTransfer } from '#/server/transfers'
import { useToast } from '#/hooks/app/use-toast'
import {
  useFocusFirstError,
  useValidationMessage,
} from '#/hooks/forms/use-validation'
import { useCloseSheet, useMarkChanged } from '#/hooks/forms/use-sheet'

type State = { errors: FieldErrors; failed: boolean; submitted: boolean }

/** The draft, both accounts' currencies, and that day's rate when they differ. */
function useTransferDraft(
  initial: TransferDraft,
  accounts: TransactionFormData['accounts'],
) {
  const markChanged = useMarkChanged()
  const [draft, setDraft] = useState(initial)
  const currencyOf = (id: string | null) =>
    accounts.find((a) => a.id === id)?.currency ?? null
  const currencies = {
    from: currencyOf(draft.fromId),
    to: currencyOf(draft.toId),
  }
  const rate = useRate(
    currencies.from ?? '',
    currencies.to ?? '',
    draft.occurredOn,
  )
  function update(changes: Partial<TransferDraft>) {
    markChanged()
    setDraft((d) => ({ ...d, ...changes }))
  }
  return { draft, update, currencies, rate }
}

function useSubmit({
  check,
  savedText,
  onSaved,
}: {
  check: () => ReturnType<typeof validateTransfer>
  savedText: string
  onSaved?: (accountId: string) => void
}) {
  const toast = useToast()
  const closeSheet = useCloseSheet()
  return useActionState(
    async (): Promise<State> => {
      const { input, errors } = check()
      if (!input) return { errors, failed: false, submitted: true }
      const result = await saveTransfer({ data: input }).catch(() => null)
      if (!result?.ok) return { errors: {}, failed: true, submitted: true }
      onSaved?.(input.fromAccountId)
      toast({ text: savedText, tone: 'success' })
      closeSheet()
      return { errors: {}, failed: false, submitted: true }
    },
    { errors: {}, failed: false, submitted: false },
  )
}

/** With fewer than two accounts, a transfer cannot be made. */
function OneAccount() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <p>{t('transactions.transfer.oneAccount')}</p>
      <Link to="/net-worth/accounts/new" className="font-semibold text-primary">
        {t('accounts.addAccount')}
      </Link>
    </div>
  )
}

/** Under the slip: De and Vers (never the same account), the date, the note. */
function TransferDetails({
  draft,
  accounts,
  error,
  onChange,
}: {
  draft: TransferDraft
  accounts: TransactionFormData['accounts']
  error: (name: string) => string | undefined
  onChange: (changes: Partial<TransferDraft>) => void
}) {
  const { t } = useTranslation()
  // Another account means another currency maybe: what arrived is valued again.
  const revalued = { received: '', receivedByHand: false }
  return (
    <>
      <AccountPicker
        label={t('transactions.transfer.from')}
        accounts={accounts}
        value={draft.fromId}
        error={error('fromId')}
        onChange={(account) =>
          onChange({
            fromId: account?.id ?? null,
            toId: draft.toId === account?.id ? null : draft.toId,
            ...revalued,
          })
        }
      />
      <AccountPicker
        label={t('transactions.transfer.to')}
        accounts={accounts}
        value={draft.toId}
        exclude={draft.fromId}
        error={error('toId')}
        onChange={(account) =>
          onChange({ toId: account?.id ?? null, ...revalued })
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

type TransferFormProps = {
  id?: string
  initial: TransferDraft
  data: TransactionFormData
  /** Set in Réglages; a fee needs it. */
  feeCategoryId: string | null
  savedText: string
  onSaved?: (accountId: string) => void
  /** A new transfer can go back to Dépense or Revenu, handing over what was typed. */
  onKind?: (kind: Exclude<EntryKind, 'transfer'>, draft: TransferDraft) => void
}

/** The draft, its submit, and its errors once submitted. */
function useTransferForm(props: TransferFormProps) {
  const { id } = props
  const message = useValidationMessage()
  const { draft, update, currencies, rate } = useTransferDraft(
    props.initial,
    props.data.accounts,
  )
  const check = () =>
    validateTransfer(draft, {
      id,
      currencies,
      rate: rate ?? null,
      feeCategorySet: props.feeCategoryId !== null,
    })
  const [state, submit, pending] = useSubmit({
    check,
    savedText: props.savedText,
    onSaved: props.onSaved,
  })
  // After a first submit, errors follow the fields as they are corrected.
  const errors = state.submitted ? (check().errors ?? {}) : {}
  const formRef = useFocusFirstError(state.errors)
  return {
    draft,
    update,
    currencies,
    rate,
    error: (name: string) => message(errors[name]),
    failed: state.failed,
    form: { action: submit, formRef, pending },
  }
}

/**
 * a transfer between two of the owner's accounts (TRX-04, 11), new (`id`
 * undefined) or edited.
 */
export function TransferForm(props: TransferFormProps) {
  const { id, data, onKind } = props
  const { t } = useTranslation()
  const panelId = useId()
  const { draft, update, currencies, rate, error, failed, form } =
    useTransferForm(props)
  const tabs = onKind && (
    <EntryTabs
      kind="transfer"
      panelId={panelId}
      onChange={(kind) => kind !== 'transfer' && onKind(kind, draft)}
    />
  )
  const choosable = data.accounts.filter((a) => !a.closedOn && !a.hiddenForNew)
  if (id === undefined && choosable.length < 2)
    return (
      <SheetBody className="flex flex-col gap-5">
        {tabs}
        <OneAccount />
      </SheetBody>
    )

  return (
    <SheetForm {...form} error={failed && t('common.saveFailed')}>
      {tabs}
      <div id={panelId} className="flex flex-col gap-5">
        <TransferReceipt
          draft={draft}
          currencies={currencies}
          rate={rate}
          feeCategorySet={props.feeCategoryId !== null}
          errors={{
            amount: error('amount'),
            received: error('received'),
            fee: error('fee'),
          }}
          autoFocus={id === undefined && !draft.amount}
          onChange={update}
        />
        <TransferDetails
          draft={draft}
          accounts={data.accounts}
          error={error}
          onChange={update}
        />
      </div>
    </SheetForm>
  )
}

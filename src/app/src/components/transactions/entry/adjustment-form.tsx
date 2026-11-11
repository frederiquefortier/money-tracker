import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedCurrency } from '#/components/display/currency-chip'
import { FieldMessage } from '#/components/forms/form-field'
import { Icon } from '#/components/display/icon'
import { Money } from '#/components/display/money'
import { SheetForm } from '#/components/sheet/sheet-form'
import {
  AccountPicker,
  DateField,
  NoteField,
} from '#/components/transactions/entry/entry-fields'
import { AmountInput } from '#/components/transactions/receipt/receipt-amount'
import {
  slipRule,
  ReceiptLine,
  slipSmall,
} from '#/components/transactions/receipt/receipt-line'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import {
  adjustmentFormSchema,
  adjustmentGap,
} from '#/lib/adjustments/adjustment'
import type { FormAccount } from '#/lib/transactions/transaction'
import { cn } from '#/lib/utils'
import { getAdjustmentBalance, saveAdjustment } from '#/server/adjustments'

export type AdjustmentValues = {
  accountId: string
  occurredOn: string
  realBalance: string
  note: string
}

/** The app's balance on a date, `undefined` while it loads. */
function useAppBalance(
  accountId: string,
  date: string,
  adjustmentId: string | undefined,
) {
  const key = accountId && date ? `${accountId}:${date}` : null
  const [loaded, setLoaded] = useState<{ key: string; balance: string }>()

  useEffect(() => {
    if (!key) return
    let current = true
    getAdjustmentBalance({ data: { accountId, on: date, adjustmentId } })
      .then((balance) => {
        if (current) setLoaded({ key, balance })
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [key, accountId, date, adjustmentId])

  return loaded?.key === key ? loaded.balance : undefined
}

/** A computed amount on the slip, a dash until it is known. */
function SlipAmount({
  amount,
  currency,
  signed = false,
}: {
  amount: string | null | undefined
  currency: string | null
  signed?: boolean
}) {
  if (amount === null || amount === undefined || currency === null)
    return <span className="text-muted-foreground">—</span>
  return <Money amount={amount} currency={currency} signed={signed} />
}

/**
 * The real balance typed big, then the app's balance on
 * that date and the gap the adjustment records.
 */
function AdjustmentReceipt({
  realBalance,
  appBalance,
  currency,
  error,
  autoFocus,
  onChange,
}: {
  realBalance: string
  appBalance: string | undefined
  currency: string | null
  error: string | undefined
  autoFocus: boolean
  onChange: (realBalance: string) => void
}) {
  const { t } = useTranslation()
  const label = t('transactions.adjustment.realBalance')
  const gap = adjustmentGap(realBalance, appBalance, currency ?? '')
  return (
    <div className="receipt flex flex-col gap-3 bg-background px-4 pt-4 font-mono">
      <span
        className={cn(
          'tracking-wide text-muted-foreground uppercase',
          slipSmall,
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-6"
        >
          <Icon name="scale" />
        </span>
        <AmountInput
          value={realBalance}
          label={label}
          invalid={Boolean(error)}
          autoFocus={autoFocus}
          onChange={onChange}
        />
        {currency && <FixedCurrency value={currency} />}
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
      {slipRule}
      <ReceiptLine label={t('transactions.adjustment.appBalance')}>
        <SlipAmount amount={appBalance} currency={currency} />
      </ReceiptLine>
      <ReceiptLine label={t('transactions.adjustment.gap')}>
        <SlipAmount amount={gap} currency={currency} signed />
      </ReceiptLine>
    </div>
  )
}

/**
 * TRX-03: the real balance the bank shows, against the app's on that date. The server
 * stores the gap, so a transaction added meanwhile cannot make it wrong. A new one
 * chooses its account; a saved one keeps it.
 */
export function AdjustmentForm({
  id,
  accounts,
  initial,
  savedText,
}: {
  id?: string
  accounts: ReadonlyArray<FormAccount>
  initial: AdjustmentValues
  savedText: string
}) {
  const [values, setValues] = useState(initial)
  const account = accounts.find((a) => a.id === values.accountId)
  const appBalance = useAppBalance(values.accountId, values.occurredOn, id)
  const form = useSheetForm({
    schema: adjustmentFormSchema,
    initial,
    save: (data) => saveAdjustment({ data: { ...data, id } }),
    savedText,
  })
  const update = (changes: Partial<AdjustmentValues>) =>
    setValues((v) => ({ ...v, ...changes }))

  return (
    <SheetForm {...form.formProps}>
      <AdjustmentReceipt
        realBalance={values.realBalance}
        appBalance={account && appBalance}
        currency={account?.currency ?? null}
        error={form.field('realBalance').error}
        autoFocus={id === undefined && values.accountId !== ''}
        onChange={(realBalance) => update({ realBalance })}
      />
      {id === undefined && (
        <AccountPicker
          accounts={accounts}
          value={values.accountId || null}
          error={form.field('accountId').error}
          onChange={(picked) => update({ accountId: picked?.id ?? '' })}
        />
      )}
      <DateField
        date={values.occurredOn}
        error={form.field('occurredOn').error}
        onChange={(occurredOn) => update({ occurredOn })}
      />
      <NoteField value={values.note} onChange={(note) => update({ note })} />
      <input type="hidden" name="accountId" value={values.accountId} />
      <input type="hidden" name="realBalance" value={values.realBalance} />
      <input type="hidden" name="note" value={values.note} />
    </SheetForm>
  )
}

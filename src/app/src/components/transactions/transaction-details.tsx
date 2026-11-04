import { useTranslation } from 'react-i18next'
import { CategoryPicker } from '#/components/categories/category-picker'
import { CheckboxField } from '#/components/checkbox-field'
import { MerchantPicker } from '#/components/merchants/merchant-picker'
import type { TransactionFormData } from '#/components/transactions/transaction-form'
import {
  AccountPicker,
  DateField,
  NoteField,
} from '#/components/transactions/detail-fields'
import { SplitFields } from '#/components/transactions/split-fields'
import { Button } from '#/components/ui/button'
import type { Merchant } from '#/lib/merchants'
import type { Draft } from '#/lib/transaction-draft'
import type { FormAccount } from '#/lib/transactions'

/** The currency follows the account, unless another one was chosen. */
function accountChanges(
  draft: Draft,
  account: FormAccount | null,
  currentCurrency: string | undefined,
): Partial<Draft> {
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
  draft: Draft,
  merchant: Merchant | null,
): Partial<Draft> {
  const fills =
    merchant?.defaultCategoryId &&
    !draft.categoryByHand &&
    draft.splitMode === null
  return {
    merchantId: merchant?.id ?? null,
    ...(fills ? { categoryId: merchant.defaultCategoryId } : {}),
  }
}

/** Account, date, merchant, category or splits, note, pending (spec 15, in that order). */
export function Details({
  draft,
  data,
  accountCurrency,
  total,
  error,
  onChange,
}: {
  draft: Draft
  data: TransactionFormData
  accountCurrency: string | null
  total: bigint | null
  error: (name: string) => string | undefined
  onChange: (changes: Partial<Draft>) => void
}) {
  const { t } = useTranslation()
  const currentCurrency = data.accounts.find(
    (a) => a.id === draft.accountId,
  )?.currency

  return (
    <>
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
      <MerchantPicker
        merchants={data.merchants}
        value={draft.merchantId}
        onChange={(merchant) => onChange(merchantChanges(draft, merchant))}
      />
      {draft.splitMode === null || !accountCurrency ? (
        <SingleCategory
          draft={draft}
          data={data}
          error={error('categoryId')}
          onChange={onChange}
        />
      ) : (
        <SplitFields
          draft={draft}
          categories={data.categories}
          total={total}
          accountCurrency={accountCurrency}
          error={error('splits')}
          onChange={onChange}
        />
      )}
      <NoteField value={draft.note} onChange={(note) => onChange({ note })} />
      <CheckboxField
        name="pending"
        label={t('transactions.pending')}
        checked={draft.pending}
        onCheckedChange={(pending) => onChange({ pending })}
      />
    </>
  )
}

function SingleCategory({
  draft,
  data,
  error,
  onChange,
}: {
  draft: Draft
  data: TransactionFormData
  error: string | undefined
  onChange: (changes: Partial<Draft>) => void
}) {
  const { t } = useTranslation()
  const kind = draft.kind
  return (
    <div className="flex flex-col gap-1">
      <CategoryPicker
        label={t('transactions.category')}
        required
        categories={data.categories}
        kind={kind}
        date={draft.occurredOn}
        frequent={data.frequent[kind]}
        value={draft.categoryId}
        error={error}
        onChange={(categoryId) =>
          onChange({ categoryId, categoryByHand: true })
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange({
            splitMode: 'amount',
            lines: [
              { key: 0, categoryId: draft.categoryId, value: '' },
              { key: 1, categoryId: null, value: '' },
            ],
          })
        }
      >
        {t('transactions.split')}
      </Button>
    </div>
  )
}

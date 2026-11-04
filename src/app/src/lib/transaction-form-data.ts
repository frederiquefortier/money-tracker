import type { TransactionFormData } from '#/components/transactions/transaction-form'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { getFormAccounts, getFrequentCategories } from '#/server/transactions'

/** What the transaction form's pickers need, loaded together. */
export async function loadTransactionForm(): Promise<TransactionFormData> {
  const [accounts, categories, merchants, frequent] = await Promise.all([
    getFormAccounts(),
    getCategories(),
    getMerchants(),
    getFrequentCategories(),
  ])
  return { accounts, categories, merchants, frequent }
}

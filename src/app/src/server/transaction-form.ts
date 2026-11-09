import type { TransactionFormData } from '#/lib/transactions/transaction'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import {
  getFormAccounts,
  getFrequentCategories,
  getFrequentPeople,
} from '#/server/transactions'

/** What the transaction form's pickers need, loaded together. */
export async function loadTransactionForm(): Promise<TransactionFormData> {
  const [accounts, categories, merchants, frequent, people, frequentPeople] =
    await Promise.all([
      getFormAccounts(),
      getCategories(),
      getMerchants(),
      getFrequentCategories(),
      getPeople(),
      getFrequentPeople(),
    ])
  return {
    accounts,
    categories,
    merchants,
    frequent,
    ...people,
    frequentPeople,
  }
}

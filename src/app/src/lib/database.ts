import type { Database as Generated } from './database.gen'

type Public = Generated['public']
type Accounts = Public['Tables']['accounts']
type SaveTransaction = Public['Functions']['save_transaction']

// The generator types numeric as number. Amounts travel as text (ADR-004).
type WithTextAmount<T> = Omit<T, 'opening_balance'> & {
  opening_balance?: string
}

// Arguments with a SQL default can also be sent as null; amounts go as text.
type SaveTransactionArgs = Omit<
  SaveTransaction['Args'],
  | 'transaction_id'
  | 'amount'
  | 'original_amount'
  | 'original_currency'
  | 'merchant_id'
> & {
  transaction_id: string | null
  amount: string
  original_amount: string | null
  original_currency: string | null
  merchant_id: string | null
}

/** The generated schema (`npm run db:types`), with amounts as decimal strings. */
export type Database = Omit<Generated, 'public'> & {
  public: Omit<Public, 'Tables' | 'Functions'> & {
    Tables: Omit<Public['Tables'], 'accounts'> & {
      accounts: Omit<Accounts, 'Insert' | 'Update'> & {
        Insert: WithTextAmount<Accounts['Insert']>
        Update: WithTextAmount<Accounts['Update']>
      }
    }
    Functions: Omit<Public['Functions'], 'save_transaction'> & {
      save_transaction: Omit<SaveTransaction, 'Args'> & {
        Args: SaveTransactionArgs
      }
    }
  }
}

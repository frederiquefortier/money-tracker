import type { Database as Generated } from './database.gen'

type Public = Generated['public']
type Accounts = Public['Tables']['accounts']
type SaveTransaction = Public['Functions']['save_transaction']
type ListTransactions = Public['Functions']['list_transactions']
type SaveTransfer = Public['Functions']['save_transfer']

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

type SaveTransferArgs = Omit<
  SaveTransfer['Args'],
  'transfer_id' | 'amount' | 'received' | 'fee'
> & {
  transfer_id: string | null
  amount: string
  received: string | null
  fee: string | null
}

// The generator types a SQL function's columns as never null.
type ListedRow = ListTransactions['Returns'][number]
type NullableListed =
  | 'transfer_id'
  | 'merchant'
  | 'note'
  | 'institution'
  | 'from_account'
  | 'from_institution'
  | 'to_account'
  | 'to_institution'
  | 'display_amount'
  | 'rate'
  | 'day_net'
  | 'fee_amount'
  | 'fee_category'
  | 'received_amount'
  | 'received_currency'
  | 'received_value'
  | 'conversion_cost'
type ListTransactionsRow = Omit<ListedRow, NullableListed> & {
  [K in NullableListed]: ListedRow[K] | null
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
    Functions: Omit<
      Public['Functions'],
      'save_transaction' | 'save_transfer' | 'list_transactions'
    > & {
      save_transaction: Omit<SaveTransaction, 'Args'> & {
        Args: SaveTransactionArgs
      }
      save_transfer: Omit<SaveTransfer, 'Args'> & {
        Args: SaveTransferArgs
      }
      list_transactions: Omit<ListTransactions, 'Returns'> & {
        Returns: Array<ListTransactionsRow>
      }
    }
  }
}

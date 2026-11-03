import type { Database as Generated } from './database.gen'

type Public = Generated['public']
type Accounts = Public['Tables']['accounts']

// The generator types numeric as number. Amounts travel as text (ADR-004).
type WithTextAmount<T> = Omit<T, 'opening_balance'> & {
  opening_balance?: string
}

/** The generated schema (`npm run db:types`), with amounts as decimal strings. */
export type Database = Omit<Generated, 'public'> & {
  public: Omit<Public, 'Tables'> & {
    Tables: Omit<Public['Tables'], 'accounts'> & {
      accounts: Omit<Accounts, 'Insert' | 'Update'> & {
        Insert: WithTextAmount<Accounts['Insert']>
        Update: WithTextAmount<Accounts['Update']>
      }
    }
  }
}

export type OwedLine = {
  id: string
  transactionId: string
  occurredOn: string
  /** The expense's merchant, or its largest category. */
  label: string
  categoryId: string | null
  currency: string
  /** What is still owed, as text (ADR-004); null while the part is not known. */
  left: string | null
}

/** PPL-05: what someone still owes me, per currency, and how many parts are unknown. */
export type Balance = {
  amounts: Array<{ amount: string; currency: string }>
  unknown: number
}

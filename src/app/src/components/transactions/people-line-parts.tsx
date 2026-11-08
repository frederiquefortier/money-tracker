import { useTranslation } from 'react-i18next'
import { Money } from '#/components/money'
import { small } from '#/components/transactions/receipt-line'
import { LineValue } from '#/components/transactions/receipt-splits'
import { formatDate } from '#/lib/format'
import { fromMinor, minorDigits, toMinor } from '#/lib/money'
import type { Draft } from '#/lib/transaction-draft'
import { isUnknown } from '#/lib/transaction-people'
import type { PersonLine } from '#/lib/transaction-people'
import { useLocale } from '#/lib/use-locale'
import { cn } from '#/lib/utils'

type Update = (changes: Partial<Draft>) => void

/**
 * A line's part as typed. Left empty, a Me doit part is not known yet ("?" in the
 * field); an empty Moi or Invité takes what is left, shown under it, as does Moi in
 * Montant when it is the line that takes it (`filled`).
 */
export function LinePart({
  line,
  name,
  draft,
  computed,
  filled,
  accountCurrency,
  onChange,
}: {
  line: PersonLine
  name: string
  draft: Draft
  computed: bigint | null | undefined
  filled: boolean
  accountCurrency: string
  onChange: Update
}) {
  const { t } = useTranslation()
  // An empty field shows what it comes to under it (spec 21).
  const empty = line.value.trim() === ''
  return (
    <LineValue
      value={line.value}
      label={t('transactions.people.part', { name })}
      placeholder={
        isUnknown(line) ? t('transactions.people.unknownMark') : undefined
      }
      showComputed={draft.peopleMode !== 'amount' || empty || filled}
      mode={draft.peopleMode}
      computed={computed}
      accountCurrency={accountCurrency}
      onChange={(value) =>
        onChange({
          people: draft.people.map((l) =>
            l.key === line.key ? { ...l, value } : l,
          ),
        })
      }
    />
  )
}

/**
 * Under a saved Me doit line, what came back and when ("Remboursé le 8 nov. 2026
 * 25,00 $"), then what is left of a known part ("Reste 5,00 $").
 */
export function BackLines({
  line,
  unknown,
  computed,
  accountCurrency,
}: {
  line: PersonLine
  unknown: boolean
  computed: bigint | null | undefined
  accountCurrency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const back = line.back ?? []
  if (line.role !== 'owes' || back.length === 0) return null
  const digits = minorDigits(accountCurrency)
  const returned = back.reduce(
    (sum, b) => sum + (toMinor(b.amount, digits) ?? 0n),
    0n,
  )
  const part = computed ?? 0n
  const left = unknown ? 0n : (part < 0n ? -part : part) - returned
  return (
    <ul className={cn('flex flex-col pl-10 text-muted-foreground', small)}>
      {back.map((b, i) => (
        <li key={i}>
          {t('transactions.people.returned', {
            date: formatDate(b.date, locale, 'medium'),
          })}{' '}
          <Money amount={b.amount} currency={accountCurrency} />
        </li>
      ))}
      {left > 0n && (
        <li>
          {t('transactions.people.left')}{' '}
          <Money amount={fromMinor(left, digits)} currency={accountCurrency} />
        </li>
      )}
    </ul>
  )
}

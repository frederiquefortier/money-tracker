import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ListCard } from '#/components/lists/list-card'
import { Money } from '#/components/display/money'
import { formatDate } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { useMoneyText } from '#/hooks/app/use-privacy'
import { cn } from '#/lib/utils'
import { useOwedLines } from '#/hooks/people/use-owed-lines'
import type { Balance } from '#/lib/people/owed'
import { fieldSurface, focusRing, rowHover } from '#/components/styles'

/** PPL-05, on a person's row: "Me doit 45,00 $", "+ inconnu" past a known part. */
export function OwedTag({ balance }: { balance: Balance | undefined }) {
  const { t } = useTranslation()
  const moneyText = useMoneyText()
  if (!balance || (balance.amounts.length === 0 && balance.unknown === 0))
    return null
  const amounts = balance.amounts
    .map((a) => moneyText(a.amount, a.currency))
    .join(' · ')
  const text = amounts
    ? t('people.owes', { amount: amounts }) +
      (balance.unknown ? ` ${t('people.plusUnknown')}` : '')
    : t('people.owesUnknown')
  return (
    <span className="shrink-0 rounded-full bg-owed px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap text-foreground">
      {text}
    </span>
  )
}

/** Under a person's form: the expenses they still owe me on, each opening its sheet. */
export function OwedLines({ personId }: { personId: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  // A failed load shows nothing, as no lines do.
  const { data: lines } = useOwedLines(personId)
  if (!lines?.length) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {t('people.owedTitle')}
      </h3>
      <ListCard className={fieldSurface}>
        {lines.map((line) => (
          <li key={line.id}>
            <Link
              to="/transactions/$transactionId"
              params={{ transactionId: line.transactionId }}
              className={cn(
                'flex items-center gap-3 px-3 py-3 text-sm',
                rowHover,
                focusRing,
              )}
            >
              <span className="min-w-0 flex-1 truncate">
                {formatDate(line.occurredOn, locale, 'medium')} · {line.label}
              </span>
              <span className="shrink-0 font-semibold">
                {line.left === null ? (
                  t('transactions.people.unknownShort')
                ) : (
                  <Money amount={line.left} currency={line.currency} />
                )}
              </span>
            </Link>
          </li>
        ))}
      </ListCard>
    </section>
  )
}

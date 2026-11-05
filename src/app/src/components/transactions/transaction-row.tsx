import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/icon'
import { AvatarStack } from '#/components/people/avatars'
import type { IconName } from '#/components/icon'
import { rowHover, stackRing } from '#/components/list-card'
import { MissingRate, Money } from '#/components/money'
import { RowActions, RowLink } from '#/components/transactions/row-actions'
import { FeeLines, feeLine, hasFees } from '#/components/transactions/fee-lines'
import { useRowText } from '#/components/transactions/row-text'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { formatDate, formatMoney } from '#/lib/format'
import { absDecimal } from '#/lib/money'
import { isOwed } from '#/lib/transaction-list'
import type { ListedCategory, ListedTransaction } from '#/lib/transaction-list'
import { useLocale } from '#/lib/use-locale'
import { cn, focusRing } from '#/lib/utils'

const badgeSize = 'size-11 [&_svg]:size-6'

const NEUTRAL_ICONS: Partial<Record<ListedTransaction['kind'], IconName>> = {
  transfer: 'arrow-left-right',
  adjustment: 'scale',
}

/**
 * The category's icon; with several (TRX-06), all of them stacked like avatars, the
 * largest share first and on top. A transfer or adjustment has a neutral icon.
 */
function RowBadge({ row }: { row: ListedTransaction }) {
  const icon = NEUTRAL_ICONS[row.kind]
  if (icon || row.categories.length === 0)
    return (
      <span
        aria-hidden="true"
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground',
          badgeSize,
        )}
      >
        <Icon name={icon ?? 'split'} />
      </span>
    )
  return (
    <span className="flex shrink-0">
      {row.categories.map((category, i) => (
        <span
          key={category.name}
          className={cn(
            'relative rounded-full',
            row.categories.length > 1 && stackRing,
            i > 0 && '-ml-7',
          )}
          style={{ zIndex: row.categories.length - i }}
        >
          <CategoryBadge
            icon={category.icon}
            color={category.color}
            className={badgeSize}
          />
        </span>
      ))}
    </span>
  )
}

/**
 * In the display currency, one size: an expense with its minus, an income with a plus
 * in green (the error red would read as "negative"), a transfer in the full list
 * unsigned. Converted, the amount as booked sits under it (CUR-09), and the rate is on
 * hover.
 */
function RowAmount({
  row,
  displayCurrency,
  signed,
}: {
  row: ListedTransaction
  displayCurrency: string
  signed: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (row.displayAmount === null) return <MissingRate />
  const converted = row.currency !== displayCurrency
  const detail =
    converted && row.rate
      ? t('transactions.list.convertedDetail', {
          original: formatMoney(absDecimal(row.amount), row.currency, locale),
          date: formatDate(row.occurredOn, locale, 'medium'),
          rate: t('transactions.rate', {
            from: row.currency,
            to: displayCurrency,
            rate: new Intl.NumberFormat(FORMAT_LOCALE[locale], {
              maximumFractionDigits: 4,
            }).format(row.rate as Intl.StringNumericLiteral),
          }),
        })
      : undefined
  return (
    <span className="flex shrink-0 flex-col items-end font-mono md:pr-4">
      <Money
        amount={row.displayAmount}
        currency={displayCurrency}
        signed={signed}
        detail={detail}
        className={cn(
          'text-lg font-semibold',
          row.kind === 'income' && 'text-income',
        )}
      />
      {converted && (
        <Money
          amount={absDecimal(row.amount)}
          currency={row.currency}
          className="text-sm text-muted-foreground"
        />
      )}
      {/* What arrived, after the arrow of the transfer's title. */}
      {row.arrival && (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          <span aria-hidden="true">→ </span>
          <Money amount={row.arrival.amount} currency={row.arrival.currency} />
        </span>
      )}
      {/* The receipt's dashed rule, as wide as the amounts, before the fee lines. */}
      {hasFees(row) && (
        <span
          aria-hidden="true"
          className="mt-1 w-full border-t border-dashed border-border"
        />
      )}
    </span>
  )
}

function RowContent({
  row,
  displayCurrency,
  signed,
  feeCategory,
}: {
  row: ListedTransaction
  displayCurrency: string
  signed: boolean
  feeCategory: ListedCategory | null
}) {
  const { t } = useTranslation()
  const { title, details } = useRowText(row)
  return (
    <>
      <span className="flex items-center gap-3">
        <span className="relative flex items-center self-stretch">
          <RowBadge row={row} />
          {hasFees(row) && (
            <span
              aria-hidden="true"
              className={cn(
                feeLine,
                'top-[calc(50%+1.375rem)] -bottom-1 left-[21px] border-l-2',
              )}
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{title}</span>
          {(details || row.people.length > 0) && (
            <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{details}</span>
              {/* Spec 20: who it was with, stacked like a group's avatars. */}
              {row.people.length > 0 && (
                <>
                  <AvatarStack items={row.people} size="md" />
                  <span className="sr-only">
                    {row.people
                      .map(
                        (p) =>
                          p.name ??
                          t('transactions.people.count', { count: p.count }),
                      )
                      .join(', ')}
                  </span>
                </>
              )}
            </span>
          )}
          {/* The blue row and the bubble show it; screen readers still hear it. */}
          {row.pending && (
            <span className="sr-only">{t('transactions.pending')}</span>
          )}
          {isOwed(row) && (
            <span className="sr-only">{t('transactions.list.owed')}</span>
          )}
        </span>
        <RowAmount
          row={row}
          displayCurrency={displayCurrency}
          signed={signed}
        />
      </span>
      <FeeLines row={row} feeCategory={feeCategory} />
    </>
  )
}

const rowLayout = 'flex min-w-0 flex-1 flex-col gap-1 py-3 pl-4 text-left'

/**
 * One transaction. An expense, income or adjustment opens its form, and a transfer or
 * its fee the transfer's (spec 16).
 */
export function TransactionRow({
  row,
  displayCurrency,
  filtered,
  feeCategory,
}: {
  row: ListedTransaction
  displayCurrency: string
  /** Filtered to one account, a transfer shows that account's leg with its sign. */
  filtered: boolean
  /** The fee category set in Réglages, drawn small on each fee line. */
  feeCategory: ListedCategory | null
}) {
  const signed = row.kind !== 'transfer' || filtered
  return (
    <li
      className={cn(
        'flex items-center pr-2',
        rowHover,
        // Pending first: the bank has not settled it, whoever owes what.
        row.pending
          ? 'bg-pending [--row-bg:var(--pending)]'
          : isOwed(row) && 'bg-owed [--row-bg:var(--owed)]',
      )}
    >
      <RowLink row={row} className={cn(rowLayout, focusRing)}>
        <RowContent
          row={row}
          displayCurrency={displayCurrency}
          signed={signed}
          feeCategory={feeCategory}
        />
      </RowLink>
      <RowActions row={row} />
    </li>
  )
}

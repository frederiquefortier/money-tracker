import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { IconActions } from '#/components/icon-button'
import { rowHover } from '#/components/list-card'
import { MissingRate, Money } from '#/components/money'
import { useToast } from '#/components/toaster'
import { TransactionActions } from '#/components/transactions/transaction-actions'
import { FORMAT_LOCALE } from '#/i18n/locales'
import { formatDate, formatMoney } from '#/lib/format'
import { accountLabel } from '#/lib/accounts'
import { absDecimal } from '#/lib/money'
import type { ListedTransaction } from '#/lib/transaction-list'
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
            row.categories.length > 1 && 'ring-2 ring-card',
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

/** The title, then the muted line: categories, account and note (spec 14). */
function useRowText(row: ListedTransaction) {
  const { t } = useTranslation()
  const categories = row.categories.map((c) => c.name).join(', ')
  if (row.transfer)
    return {
      title: t('transactions.list.transfer', {
        from: accountLabel(row.transfer.from),
        to: accountLabel(row.transfer.to),
      }),
      details: row.note ?? '',
    }
  if (row.kind === 'adjustment')
    return {
      title: t('transactions.list.adjustment'),
      details: [accountLabel(row.account), row.note]
        .filter(Boolean)
        .join(' · '),
    }
  return {
    title: row.merchant ?? categories,
    details: [
      row.merchant ? categories : '',
      accountLabel(row.account),
      row.note,
    ]
      .filter(Boolean)
      .join(' · '),
  }
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
    </span>
  )
}

function RowContent({
  row,
  displayCurrency,
  signed,
}: {
  row: ListedTransaction
  displayCurrency: string
  signed: boolean
}) {
  const { t } = useTranslation()
  const { title, details } = useRowText(row)
  return (
    <>
      <RowBadge row={row} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{title}</span>
        {(details || row.pending) && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {details && <span className="truncate">{details}</span>}
            {row.pending && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <Icon name="clock" className="size-4" />
                {t('transactions.pending')}
              </span>
            )}
          </span>
        )}
      </span>
      <RowAmount row={row} displayCurrency={displayCurrency} signed={signed} />
    </>
  )
}

const rowLayout = 'flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left'

/**
 * One transaction. An expense or income opens its form; a transfer, its fee and an
 * adjustment wait for spec 16, so a tap says so.
 */
export function TransactionRow({
  row,
  displayCurrency,
  filtered,
}: {
  row: ListedTransaction
  displayCurrency: string
  /** Filtered to one account, a transfer shows that account's leg with its sign. */
  filtered: boolean
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const signed = row.kind !== 'transfer' || filtered
  const content = (
    <RowContent row={row} displayCurrency={displayCurrency} signed={signed} />
  )
  const editable =
    (row.kind === 'expense' || row.kind === 'income') && !row.transferId

  return (
    <li className={cn('flex items-center pr-2', rowHover)}>
      {editable ? (
        <Link
          to="/transactions/$transactionId"
          params={{ transactionId: row.id }}
          className={cn(rowLayout, focusRing)}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() =>
            toast({
              text: t(
                row.kind === 'adjustment'
                  ? 'transactions.list.adjustSoon'
                  : 'transactions.transferSoon',
              ),
            })
          }
          className={cn(rowLayout, focusRing)}
        >
          {content}
        </button>
      )}
      {editable ? (
        <TransactionActions
          summary={{
            id: row.id,
            occurredOn: row.occurredOn,
            amount: row.amount,
            currency: row.currency,
            merchant: row.merchant,
            categories: row.categories.map((c) => c.name),
            account: row.account,
          }}
        />
      ) : (
        <IconActions slots={1} />
      )}
    </li>
  )
}

import { useTranslation } from 'react-i18next'
import { CurrencyCode } from '#/components/display/currency-code'
import { Money } from '#/components/display/money'
import { Tag } from '#/components/display/tag'
import { HoldingActions } from '#/components/holdings/list/holding-actions'
import { ListRow } from '#/components/lists/list-row'
import { percentFormat } from '#/lib/shared/format'
import { compareDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'
import { useLocale } from '#/hooks/app/use-locale'
import type { ListedHolding } from '#/lib/holdings/holding'

/** What came out of the holding, shown only once something did. */
function Withdrawn({ holding }: { holding: ListedHolding }) {
  const { t } = useTranslation()
  if (!holding.withdrawn || compareDecimal(holding.withdrawn, '0') <= 0)
    return null
  return (
    <span className="block text-xs text-muted-foreground">
      {t('holdings.withdrawn')}{' '}
      <Money amount={holding.withdrawn} currency={holding.currency} />
    </span>
  )
}

function Profit({ holding }: { holding: ListedHolding }) {
  const locale = useLocale()
  if (holding.kind !== 'investment' || holding.profit === null) return null
  const gain = !holding.profit.startsWith('-')
  return (
    <span
      className={cn('block text-xs', gain ? 'text-income' : 'text-destructive')}
    >
      <Money amount={holding.profit} currency={holding.currency} signed />
      {holding.profitPercent !== null && (
        <>
          {' '}
          {percentFormat(locale, 1).format(Number(holding.profitPercent) / 100)}
        </>
      )}
    </span>
  )
}

/** A debt's value shows negative, so a drawer's rows add up to its total. */
function Value({ holding }: { holding: ListedHolding }) {
  if (holding.latestValue === null) return null
  const debt = holding.kind === 'debt' && holding.latestValue !== '0.0000'
  return (
    <>
      <Money
        amount={debt ? `-${holding.latestValue}` : holding.latestValue}
        currency={holding.currency}
        className="text-lg font-semibold"
      />
      <Profit holding={holding} />
      <Withdrawn holding={holding} />
    </>
  )
}

/** One holding in a drawer: its label and kind, the type, the latest value and the profit. */
export function HoldingRow({
  holding,
  aside,
  alignTop = false,
}: {
  holding: ListedHolding
  /** Replaces the value on the right, for an archived row. */
  aside?: React.ReactNode
  alignTop?: boolean
}) {
  const { t } = useTranslation()
  return (
    <ListRow
      link={{
        to: '/net-worth/holdings/$holdingId',
        params: { holdingId: holding.id },
      }}
      alignTop={alignTop}
      actions={
        <HoldingActions
          holding={holding}
          className={alignTop ? 'pt-2' : undefined}
        />
      }
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="truncate">{holding.label}</span>
          <Tag>{t(`holdings.kindOne.${holding.kind}`)}</Tag>
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {holding.name && <>{holding.typeText} </>}
          <CurrencyCode code={holding.currency} className="font-semibold" />
        </span>
      </span>
      <span className="text-right md:pr-4">
        {aside ?? <Value holding={holding} />}
      </span>
    </ListRow>
  )
}

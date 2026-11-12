import { useTranslation } from 'react-i18next'
import { CurrencyCode } from '#/components/display/currency-code'
import { Money } from '#/components/display/money'
import { Tag } from '#/components/display/tag'
import { HoldingActions } from '#/components/holdings/list/holding-actions'
import { ListRow } from '#/components/lists/list-row'
import { percentFormat } from '#/lib/shared/format'
import { cn } from '#/lib/utils'
import { useLocale } from '#/hooks/app/use-locale'
import type { ListedHolding } from '#/lib/holdings/holding'

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

/** One holding in a list: name, institution and type, the latest value and the profit. */
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
  const details = [holding.institutionName, holding.typeLabel]
    .filter(Boolean)
    .join(' · ')
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
      <span
        className={cn(
          'min-w-0 flex-1',
          holding.excludeFromNetWorth && 'text-muted-foreground',
        )}
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="truncate">{holding.name}</span>
          {holding.excludeFromNetWorth && <Tag>{t('holdings.excluded')}</Tag>}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {details}{' '}
          <CurrencyCode code={holding.currency} className="font-semibold" />
        </span>
      </span>
      <span className="text-right md:pr-4">
        {aside ??
          (holding.latestValue !== null && (
            <>
              <Money
                amount={holding.latestValue}
                currency={holding.currency}
                className="font-semibold"
              />
              <Profit holding={holding} />
            </>
          ))}
      </span>
    </ListRow>
  )
}

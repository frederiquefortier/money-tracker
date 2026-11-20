import { useTranslation } from 'react-i18next'
import { Money } from '#/components/display/money'
import { ChangeText } from '#/components/display/change-text'
import { compareDecimal } from '#/lib/shared/money'
import type { Holding } from '#/lib/holdings/holding'
import { NO_FIGURE } from '#/lib/shared/format'

function Figure({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-end">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-semibold">{children}</dd>
    </div>
  )
}

/**
 * Over an investment's chart: the money placed and withdrawn and the profit since it
 * opened, whatever the range (NW-03). The row's figure is the return over the range
 * (ADR-062).
 */
export function HoldingFigures({ holding }: { holding: Holding }) {
  const { t } = useTranslation()
  const { placed, withdrawn, profit, profitPercent, currency } = holding
  return (
    <dl className="mb-4 flex flex-wrap justify-end gap-x-8 gap-y-2">
      <Figure label={t('holdings.placed')}>
        {placed === null ? (
          NO_FIGURE
        ) : (
          <Money amount={placed} currency={currency} />
        )}
      </Figure>
      {withdrawn !== null && compareDecimal(withdrawn, '0') > 0 && (
        <Figure label={t('holdings.withdrawn')}>
          <Money amount={withdrawn} currency={currency} />
        </Figure>
      )}
      <Figure label={t('holdings.profit')}>
        {profit === null ? (
          NO_FIGURE
        ) : (
          <ChangeText
            change={{ amount: profit, percent: profitPercent }}
            currency={currency}
            className="text-sm"
          />
        )}
      </Figure>
    </dl>
  )
}

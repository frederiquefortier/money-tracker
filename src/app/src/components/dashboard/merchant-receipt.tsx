import { useTranslation } from 'react-i18next'
import { ChangeText } from '#/components/display/change-text'
import { MissingRate, Money } from '#/components/display/money'
import {
  receiptSlip,
  slipLabel,
  slipLine,
  slipRuleLine,
} from '#/components/styles'
import type { BillRow } from '#/lib/dashboard/merchant-bills'
import { cn } from '#/lib/utils'

function SlipLine({
  label,
  children,
  large = false,
}: {
  label: string
  children: React.ReactNode
  large?: boolean
}) {
  return (
    <div
      className={cn(slipLine, large ? 'text-base font-semibold' : 'text-sm')}
    >
      <dt className={slipLabel}>{label}</dt>
      <dd className="whitespace-nowrap tabular-nums">{children}</dd>
    </div>
  )
}

function Amount({
  amount,
  currency,
}: {
  amount: string | null
  currency: string
}) {
  return amount === null ? (
    <MissingRate />
  ) : (
    <Money amount={amount} currency={currency} />
  )
}

/**
 * A merchant's typical bill as the transaction form's slip: the
 * average first, the smallest and largest bill, then a year earlier's average and the
 * change on its line. The name, the count and the total are in the row above.
 */
export function MerchantReceipt({
  row,
  compared,
  currency,
}: {
  row: BillRow
  /** The year the change compares with, "2025". */
  compared: string | null
  currency: string
}) {
  const { t } = useTranslation()
  const { figures, before, change } = row
  return (
    <div className={cn(receiptSlip, 'w-full sm:w-72')}>
      <dl className="flex flex-col gap-1.5">
        <SlipLine label={t('dashboard.merchants.receiptAverage')} large>
          <Amount amount={figures.average} currency={currency} />
        </SlipLine>
        <SlipLine label={t('dashboard.merchants.smallest')}>
          <Amount amount={figures.min} currency={currency} />
        </SlipLine>
        <SlipLine label={t('dashboard.merchants.largest')}>
          <Amount amount={figures.max} currency={currency} />
        </SlipLine>
      </dl>
      {compared && before?.average && (
        <>
          <hr className={slipRuleLine} />
          <dl className="flex flex-col gap-1.5">
            <SlipLine
              label={t('dashboard.merchants.averageIn', { year: compared })}
            >
              <span className="flex items-baseline gap-2">
                <Amount amount={before.average} currency={currency} />
                {change && (
                  <ChangeText
                    change={change}
                    currency={currency}
                    percentOnly
                    lowerIsBetter
                  />
                )}
              </span>
            </SlipLine>
          </dl>
        </>
      )}
    </div>
  )
}

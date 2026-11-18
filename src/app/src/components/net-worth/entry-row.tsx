import { useTranslation } from 'react-i18next'
import type { LinkOptions } from '@tanstack/react-router'
import { AccountActions } from '#/components/accounts/list/account-actions'
import { CurrencyCode } from '#/components/display/currency-code'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { Money } from '#/components/display/money'
import { HoldingActions } from '#/components/holdings/list/holding-actions'
import { ListRow } from '#/components/lists/list-row'
import { compareDecimal } from '#/lib/shared/money'
import { formatMoney } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import type { NetWorthEntry } from '#/lib/net-worth/net-worth-list'

/** The item's own form, over the hub. */
function entryLink(entry: NetWorthEntry): LinkOptions {
  return entry.type === 'account'
    ? { to: '/net-worth/accounts/$accountId', params: { accountId: entry.id } }
    : { to: '/net-worth/holdings/$holdingId', params: { holdingId: entry.id } }
}

function Flag({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span title={label}>
      <Icon name={icon} label={label} className="text-muted-foreground" />
    </span>
  )
}

/**
 * After the type and currency: what is pending, or what a holding gave back. An
 * investment's money in and out is over its chart (HoldingFigures).
 */
function Extras({ entry }: { entry: NetWorthEntry }) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (entry.type === 'account') {
    const { pending, currency } = entry.account
    if (compareDecimal(pending, '0') === 0) return null
    return (
      <>
        {' · '}
        {t('accounts.pending', {
          amount: formatMoney(pending, currency, locale),
        })}
      </>
    )
  }
  const { kind, withdrawn, currency } = entry.holding
  if (
    kind === 'investment' ||
    !withdrawn ||
    compareDecimal(withdrawn, '0') <= 0
  )
    return null
  return (
    <>
      {' · '}
      {t('holdings.withdrawn')} <Money amount={withdrawn} currency={currency} />
    </>
  )
}

/**
 * One account or holding on the hub: its name, its type, currency and details, `trailing` on
 * the right, its actions behind a ⋮ at every width. The whole row opens the item's form.
 */
export function EntryRow({
  entry,
  label,
  hidden = false,
  trailing,
}: {
  entry: NetWorthEntry
  label: string
  /** Left out of the net worth in this browser (NW-05). */
  hidden?: boolean
  /** After the link, over its stretched area: a control and read-only content. */
  trailing?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <ListRow
      link={entryLink(entry)}
      trailing={trailing}
      stretched={trailing !== undefined}
      actions={
        entry.type === 'account' ? (
          <AccountActions account={entry.account} placement="menu" />
        ) : (
          <HoldingActions holding={entry.holding} placement="menu" />
        )
      }
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          {hidden && <Flag icon="eye-off" label={t('netWorth.hide.hidden')} />}
          {entry.type === 'account' && entry.account.hiddenForNew && (
            <Flag icon="circle-slash" label={t('accounts.hidden')} />
          )}
          <span className={cn('truncate', hidden && 'text-muted-foreground')}>
            {label}
          </span>
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {entry.typeText}{' '}
          <CurrencyCode code={entry.currency} className="font-semibold" />
          <Extras entry={entry} />
        </span>
      </span>
    </ListRow>
  )
}

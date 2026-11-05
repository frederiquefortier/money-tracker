import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/account-actions'
import { Icon } from '#/components/icon'
import { rowHover } from '#/components/list-card'
import { cn, focusRing } from '#/lib/utils'
import type { Account } from '#/server/accounts'

export type ListedAccount = Account & { typeLabel: string }

/**
 * One account in a list: name, then `details` and the currency, `aside` on the right.
 * `alignTop` sets `aside` and the actions level with the name (archived rows, spec 11).
 */
export function AccountRow({
  account,
  details,
  aside,
  alignTop = false,
}: {
  account: ListedAccount
  details: string
  aside: React.ReactNode
  alignTop?: boolean
}) {
  const { t } = useTranslation()
  const align = alignTop ? 'items-start' : 'items-center'
  return (
    <li className={cn('flex pr-2', align, rowHover)}>
      <Link
        to="/accounts/$accountId"
        params={{ accountId: account.id }}
        className={cn('flex min-w-0 flex-1 gap-3 py-3 pl-4', align, focusRing)}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-semibold">
            {account.hiddenForNew && (
              <span title={t('accounts.hidden')}>
                <Icon
                  name="eye-off"
                  label={t('accounts.hidden')}
                  className="text-muted-foreground"
                />
              </span>
            )}
            <span className="truncate">{account.name}</span>
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {details}{' '}
            <span className="font-mono font-semibold">{account.currency}</span>
          </span>
        </span>
        <span className="text-right md:pr-4">{aside}</span>
      </Link>
      <AccountActions
        account={account}
        className={alignTop ? 'pt-2' : undefined}
      />
    </li>
  )
}

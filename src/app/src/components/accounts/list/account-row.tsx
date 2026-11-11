import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/list/account-actions'
import { Icon } from '#/components/display/icon'
import { ListRow } from '#/components/lists/list-row'
import type { Account } from '#/lib/accounts/account'

export type ListedAccount = Account & { typeLabel: string }

/**
 * One account in a list: name, then `details` and the currency, `aside` on the right.
 * `alignTop` sets `aside` and the actions level with the name (archived rows).
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
  return (
    <ListRow
      link={{ to: '/accounts/$accountId', params: { accountId: account.id } }}
      alignTop={alignTop}
      actions={
        <AccountActions
          account={account}
          className={alignTop ? 'pt-2' : undefined}
        />
      }
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
    </ListRow>
  )
}

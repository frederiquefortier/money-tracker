import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/account-actions'
import { Icon } from '#/components/icon'
import type { Locale } from '#/i18n/locales'
import { formatDate } from '#/lib/format'
import { cn, focusRing } from '#/lib/utils'
import type { ListedAccount } from '#/components/accounts/account-group'
import type { Institution } from '#/server/accounts'

/** ACC-03: closed accounts, flat and muted, with their closing date. */
export function ClosedAccounts({
  accounts,
  institutions,
  locale,
}: {
  accounts: ReadonlyArray<ListedAccount>
  institutions: ReadonlyArray<Institution>
  locale: Locale
}) {
  const { t } = useTranslation()
  if (accounts.length === 0) return null
  return (
    <details className="group">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        <Icon
          name="chevron-down"
          className="size-5 -rotate-90 transition-transform group-open:rotate-0"
        />
        {t('accounts.closed', { count: accounts.length })}
      </summary>
      <ul className="mt-2 divide-y overflow-hidden rounded-xl border bg-card text-muted-foreground">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex items-start pr-2 hover:bg-secondary/60"
          >
            <Link
              to="/settings/accounts/$accountId"
              params={{ accountId: account.id }}
              className={cn(
                'flex min-w-0 flex-1 items-start justify-between gap-3 py-3 pl-4',
                focusRing,
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {account.name}
                </span>
                <span className="block truncate text-sm">
                  {[
                    institutions.find((i) => i.id === account.institutionId)
                      ?.name,
                    account.typeLabel,
                  ]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  <span className="font-mono font-semibold">
                    {account.currency}
                  </span>
                </span>
              </span>
              <span className="text-sm leading-6 whitespace-nowrap">
                {account.closedOn &&
                  t('accounts.closedOn', {
                    date: formatDate(account.closedOn, locale, 'medium'),
                  })}
              </span>
            </Link>
            {/* Level with the name: the archived date sits on the first line. */}
            <AccountActions account={account} className="pt-2" />
          </li>
        ))}
      </ul>
    </details>
  )
}

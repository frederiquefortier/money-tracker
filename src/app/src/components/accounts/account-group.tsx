import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/account-actions'
import { Icon } from '#/components/icon'
import { IconAnchor, IconLink } from '#/components/icon-button'
import { MissingRate, Money } from '#/components/money'
import type { Locale } from '#/i18n/locales'
import { formatMoney } from '#/lib/format'
import { cn, focusRing } from '#/lib/utils'
import type { Account, GroupTotal, Institution } from '#/server/accounts'

export type ListedAccount = Account & { typeLabel: string }

function AccountRow({
  account,
  locale,
}: {
  account: ListedAccount
  locale: Locale
}) {
  const { t } = useTranslation()
  const hasPending = !/^-?0(\.0+)?$/.test(account.pending)
  return (
    <li className="flex items-center pr-2 hover:bg-secondary/60">
      <Link
        to="/settings/accounts/$accountId"
        params={{ accountId: account.id }}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 py-3 pl-4',
          focusRing,
        )}
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
          <span className="block text-sm text-muted-foreground">
            {account.typeLabel}{' '}
            <span className="font-mono font-semibold">{account.currency}</span>
          </span>
        </span>
        <span className="text-right">
          <Money
            amount={account.balance}
            currency={account.currency}
            locale={locale}
            className="font-semibold"
          />
          {hasPending && (
            <span className="block text-xs text-muted-foreground">
              {t('accounts.pending', {
                amount: formatMoney(account.pending, account.currency, locale),
              })}
            </span>
          )}
        </span>
      </Link>
      <AccountActions account={account} />
    </li>
  )
}

/** An institution with no open account still shows, so it can be found (ACC-05). */
function EmptyGroup() {
  const { t } = useTranslation()
  return (
    <p className="border-t px-4 py-3 text-sm text-muted-foreground">
      {t('accounts.emptyInstitution')}
    </p>
  )
}

function EditInstitution({ institution }: { institution: Institution }) {
  const { t } = useTranslation()
  return (
    <IconLink
      icon="pencil"
      label={t('accounts.editInstitution', { name: institution.name })}
      to="/settings/accounts/institutions/$institutionId"
      params={{ institutionId: institution.id }}
    />
  )
}

function GroupTotalAmount({
  total,
  currency,
  locale,
}: {
  total: GroupTotal | undefined
  currency: string
  locale: Locale
}) {
  // No total: the group holds only closed accounts.
  if (!total) return null
  if (total.total === null) return <MissingRate />
  return (
    <Money
      amount={total.total}
      currency={currency}
      locale={locale}
      converted={total.converted}
      className="font-bold"
    />
  )
}

function CollapseToggle({
  name,
  collapsed,
  onToggle,
}: {
  name: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={t(collapsed ? 'accounts.expand' : 'accounts.collapse', {
        name,
      })}
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-lg font-bold',
        focusRing,
      )}
    >
      <Icon
        name="chevron-down"
        className={cn('size-5 transition-transform', collapsed && '-rotate-90')}
      />
      <span className="truncate">{name}</span>
    </button>
  )
}

/** One institution's card (ACC-06): collapsible, total of its open accounts. */
export function AccountGroup({
  institution,
  accounts,
  total,
  displayCurrency,
  locale,
  collapsed,
  onToggle,
}: {
  institution: Institution | null
  accounts: ReadonlyArray<ListedAccount>
  total: GroupTotal | undefined
  displayCurrency: string
  locale: Locale
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const name = institution?.name ?? t('accounts.noInstitution')
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center gap-2 py-2.5 pr-2 pl-3">
        <CollapseToggle name={name} collapsed={collapsed} onToggle={onToggle} />
        {institution?.websiteUrl && (
          <IconAnchor
            icon="external-link"
            label={t('accounts.website', { name })}
            href={institution.websiteUrl}
          />
        )}
        <span className="ml-auto">
          <GroupTotalAmount
            total={total}
            currency={displayCurrency}
            locale={locale}
          />
        </span>
        {institution && <EditInstitution institution={institution} />}
      </header>
      {!collapsed && accounts.length > 0 && (
        <ul className="divide-y border-t">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} locale={locale} />
          ))}
        </ul>
      )}
      {!collapsed && accounts.length === 0 && institution && <EmptyGroup />}
    </section>
  )
}

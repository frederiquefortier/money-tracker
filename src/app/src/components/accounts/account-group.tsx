import { useTranslation } from 'react-i18next'
import { AccountRow } from '#/components/accounts/account-row'
import type { ListedAccount } from '#/components/accounts/account-row'
import { InstitutionActions } from '#/components/accounts/institution-actions'
import { CollapseToggle } from '#/components/collapse-toggle'
import { Link } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import { iconHover } from '#/components/icon-button'
import { cardSurface, rowHover } from '#/components/list-card'
import { MissingRate, Money } from '#/components/money'
import { compareDecimal } from '#/lib/money'
import { formatMoney } from '#/lib/format'
import { cn, focusRing } from '#/lib/utils'
import { useLocale } from '#/lib/use-locale'
import type { GroupTotal, Institution } from '#/server/accounts'

function Balance({ account }: { account: ListedAccount }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <>
      <Money
        amount={account.balance}
        currency={account.currency}
        className="font-semibold"
      />
      {compareDecimal(account.pending, '0') !== 0 && (
        <span className="block text-xs text-muted-foreground">
          {t('accounts.pending', {
            amount: formatMoney(account.pending, account.currency, locale),
          })}
        </span>
      )}
    </>
  )
}

function GroupTotalAmount({
  total,
  currency,
}: {
  total: GroupTotal | undefined
  currency: string
}) {
  // No total: the group holds only closed accounts.
  if (!total) return null
  if (total.total === null) return <MissingRate />
  return (
    <Money
      amount={total.total}
      currency={currency}
      converted={total.converted}
      className="font-bold"
    />
  )
}

/** Shows or hides the institution's accounts: the chevron alone, as on a category parent. */
function GroupToggle({
  name,
  expanded,
  onToggle,
}: {
  name: string
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={t('accounts.accountsOf', { name })}
      className={cn('z-10 shrink-0 rounded-lg', iconHover.self, focusRing)}
    >
      <Icon
        name="chevron-down"
        className={cn(
          'block size-5 transition-transform',
          !expanded && '-rotate-90',
        )}
      />
    </button>
  )
}

/**
 * The card header. An institution's opens its form from anywhere on the line, like any
 * row: its name is a link stretched over the header, the controls sit above it. The
 * group without an institution has no form, so its name toggles.
 */
function GroupHeader({
  institution,
  name,
  inUse,
  collapsed,
  onToggle,
  children,
}: {
  institution: Institution | null
  name: string
  inUse: boolean
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  if (!institution)
    return (
      <header className="flex items-center gap-2 py-2.5 pr-2 pl-3">
        <CollapseToggle
          expanded={!collapsed}
          onToggle={onToggle}
          className="font-bold"
        >
          {name}
        </CollapseToggle>
        <span className="ml-auto">{children}</span>
      </header>
    )
  return (
    <header
      className={cn(
        'relative flex items-center gap-1.5 py-2.5 pr-2 pl-3',
        rowHover,
      )}
    >
      <GroupToggle name={name} expanded={!collapsed} onToggle={onToggle} />
      <Link
        to="/accounts/institutions/$institutionId"
        params={{ institutionId: institution.id }}
        className={cn(
          'min-w-0 truncate rounded-lg font-bold after:absolute after:inset-0',
          focusRing,
        )}
      >
        {name}
      </Link>
      <span className="ml-auto md:pr-4">{children}</span>
      <span className="relative z-10">
        <InstitutionActions institution={institution} inUse={inUse} />
      </span>
    </header>
  )
}

/** One institution's card (ACC-06): collapsible, total of its open accounts. */
export function AccountGroup({
  institution,
  accounts,
  inUse,
  total,
  displayCurrency,
  collapsed,
  onToggle,
}: {
  institution: Institution | null
  accounts: ReadonlyArray<ListedAccount>
  /** Any account, open or closed, is in this institution. */
  inUse: boolean
  total: GroupTotal | undefined
  displayCurrency: string
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const name = institution?.name ?? t('accounts.noInstitution')
  return (
    <section className={cardSurface}>
      <GroupHeader
        institution={institution}
        name={name}
        inUse={inUse}
        collapsed={collapsed}
        onToggle={onToggle}
      >
        <GroupTotalAmount total={total} currency={displayCurrency} />
      </GroupHeader>
      {!collapsed && accounts.length > 0 && (
        <ul className="divide-y border-t">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              details={account.typeLabel}
              aside={<Balance account={account} />}
            />
          ))}
        </ul>
      )}
      {/* An institution with no open account still shows, so it can be found (ACC-05). */}
      {!collapsed && accounts.length === 0 && institution && (
        <p className="border-t px-4 py-3 text-sm text-muted-foreground">
          {t('accounts.emptyInstitution')}
        </p>
      )}
    </section>
  )
}

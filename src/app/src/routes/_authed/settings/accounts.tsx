import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountGroup } from '#/components/accounts/account-group'
import type { ListedAccount } from '#/components/accounts/account-row'
import { ClosedAccounts } from '#/components/accounts/closed-accounts'
import { SortMenu } from '#/components/accounts/sort-menu'
import { Icon } from '#/components/icon'
import { SettingsPage } from '#/components/settings-page'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { NO_INSTITUTION, SORTS, sortAccounts, typeLabel } from '#/lib/accounts'
import type { Sort } from '#/lib/accounts'
import { useLocale } from '#/lib/use-locale'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { useStoredState } from '#/lib/use-stored-state'
import { getAccounts } from '#/server/accounts'
import type { AccountsPage } from '#/server/accounts'

export const Route = createFileRoute('/_authed/settings/accounts')({
  loader: () => getAccounts(),
  component: Accounts,
})

const parseSort = (v: unknown) =>
  SORTS.find((s) => s === v) satisfies Sort | undefined
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

const groupKey = (institutionId: string | null) =>
  institutionId ?? NO_INSTITUTION

/** Rows with their type label, open ones sorted (ACC-07), groups alphabetical (ACC-06). */
function shape(page: AccountsPage, locale: Locale, sort: Sort) {
  const types = new Map(page.types.map((type) => [type.code, type]))
  const listed: Array<ListedAccount> = page.accounts.map((account) => {
    const type = types.get(account.type)
    return {
      ...account,
      typeLabel: type ? typeLabel(type, locale) : account.type,
    }
  })
  const open = sortAccounts(
    listed.filter((a) => !a.closedOn),
    sort,
    FORMAT_LOCALE[locale],
  )
  const groups = [
    ...page.institutions.map((institution) => ({
      key: institution.id,
      institution,
    })),
    ...(open.some((a) => !a.institutionId)
      ? [{ key: NO_INSTITUTION, institution: null }]
      : []),
  ]
  const used = new Set(page.accounts.map((a) => groupKey(a.institutionId)))
  return { listed, open, groups, used }
}

function AddMenu() {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Icon name="plus" className="size-4" />
          {t('accounts.addMenu')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/settings/accounts/new">{t('accounts.addAccount')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/accounts/institutions/new">
            {t('accounts.addInstitution')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Accounts() {
  const { t } = useTranslation()
  const page = Route.useLoaderData()
  const locale = useLocale()
  const { displayCurrency } = useMyCurrencies()
  const [sort, setSort] = useStoredState<Sort>(
    'accounts.sort',
    'name',
    parseSort,
  )
  const [collapsed, setCollapsed] = useStoredState<Array<string>>(
    'accounts.collapsed',
    [],
    parseIds,
  )

  const { listed, open, groups, used } = shape(page, locale, sort)

  function toggle(key: string) {
    setCollapsed(
      collapsed.includes(key)
        ? collapsed.filter((k) => k !== key)
        : [...collapsed, key],
    )
  }

  return (
    <SettingsPage
      title={t('accounts.title')}
      actions={
        <>
          <SortMenu sort={sort} onChange={setSort} />
          <AddMenu />
        </>
      }
    >
      {page.accounts.length === 0 && (
        <p className="py-6 text-center text-muted-foreground">
          {t('accounts.empty')}
        </p>
      )}
      {groups.map(({ key, institution }) => (
        <AccountGroup
          key={key}
          institution={institution}
          accounts={open.filter((a) => groupKey(a.institutionId) === key)}
          inUse={used.has(key)}
          total={page.totals[key]}
          displayCurrency={displayCurrency}
          collapsed={collapsed.includes(key)}
          onToggle={() => toggle(key)}
        />
      ))}
      <ClosedAccounts
        accounts={listed.filter((a) => a.closedOn)}
        institutions={page.institutions}
      />
      {/* The account form opens here as a sheet, over the list (spec 11). */}
      <Outlet />
    </SettingsPage>
  )
}

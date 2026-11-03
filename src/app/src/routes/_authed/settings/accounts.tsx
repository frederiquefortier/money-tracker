import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { AccountGroup } from '#/components/accounts/account-group'
import type { ListedAccount } from '#/components/accounts/account-group'
import { ClosedAccounts } from '#/components/accounts/closed-accounts'
import { SortMenu } from '#/components/accounts/sort-menu'
import { BackLink } from '#/components/back-link'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { SORTS, sortAccounts } from '#/lib/accounts'
import type { Sort } from '#/lib/accounts'
import { useStoredState } from '#/lib/use-stored-state'
import { getAccounts } from '#/server/accounts'

export const Route = createFileRoute('/_authed/settings/accounts')({
  loader: () => getAccounts(),
  component: Accounts,
})

const parseSort = (v: unknown) =>
  SORTS.find((s) => s === v) satisfies Sort | undefined
const parseIds = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : undefined

// '' is the group of accounts without an institution.
const NONE = ''

type Page = Awaited<ReturnType<typeof getAccounts>>

/** Rows with their type label, open ones sorted (ACC-07), groups alphabetical (ACC-06). */
function shape(page: Page, locale: Locale, sort: Sort) {
  const listed: Array<ListedAccount> = page.accounts.map((account) => {
    const type = page.types.find((ty) => ty.code === account.type)
    const typeLabel =
      (locale === 'fr' ? type?.labelFr : type?.labelEn) ?? account.type
    return { ...account, typeLabel }
  })
  const open = sortAccounts(
    listed.filter((a) => !a.closedOn),
    sort,
    FORMAT_LOCALE[locale],
  )
  const groups = [
    ...page.institutions.map((institution) => ({
      key: institution.id,
      institution: institution,
    })),
    ...(open.some((a) => !a.institutionId)
      ? [{ key: NONE, institution: null }]
      : []),
  ]
  return { listed, open, groups }
}

function AccountsHeader({
  sort,
  onSort,
}: {
  sort: Sort
  onSort: (sort: Sort) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
        {t('accounts.title')}
      </h1>
      <div className="flex items-center gap-2">
        <SortMenu sort={sort} onChange={onSort} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Icon name="plus" className="size-4" />
              {t('accounts.addMenu')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/settings/accounts/new">
                {t('accounts.addAccount')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/accounts/institutions/new">
                {t('accounts.addInstitution')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function Accounts() {
  const { t } = useTranslation()
  const page = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const currencies = useMyCurrencies()
  const locale = session.locale
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

  const { listed, open, groups } = shape(page, locale, sort)

  function toggle(key: string) {
    setCollapsed(
      collapsed.includes(key)
        ? collapsed.filter((k) => k !== key)
        : [...collapsed, key],
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/settings" label={t('settings.back')} />
      <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-4">
        <AccountsHeader sort={sort} onSort={setSort} />
        {page.accounts.length === 0 && (
          <p className="py-6 text-center text-muted-foreground">
            {t('accounts.empty')}
          </p>
        )}
        {groups.map(({ key, institution }) => (
          <AccountGroup
            key={key}
            institution={institution}
            accounts={open.filter((a) => (a.institutionId ?? NONE) === key)}
            total={page.totals[key]}
            displayCurrency={currencies.displayCurrency}
            locale={locale}
            collapsed={collapsed.includes(key)}
            onToggle={() => toggle(key)}
          />
        ))}
        <ClosedAccounts
          accounts={listed.filter((a) => a.closedOn)}
          institutions={page.institutions}
          locale={locale}
        />
      </div>
      {/* The account form opens here as a sheet, over the list (spec 11). */}
      <Outlet />
    </div>
  )
}

import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddButton } from '#/components/layout/floating-add-button'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { ListPage } from '#/components/layout/list-page'
import { ArchivedOn } from '#/components/people/list/archived-on'
import { CollapsedSection } from '#/components/lists/collapsed-section'
import { PeopleRow } from '#/components/people/list/people-row'
import { SearchField } from '#/components/forms/search-field'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import {
  PEOPLE_SORTS,
  PEOPLE_TABS,
  namesOf,
  withMemberNames,
} from '#/lib/people/person'
import type {
  PeopleSort,
  PeopleTab,
  Person,
  PersonGroup,
} from '#/lib/people/person'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getBalances } from '#/server/owed'
import { getPeople } from '#/server/people'
import { OwedTag } from '#/components/people/list/owed-summary'
import { byName, oneOf } from '#/lib/shared/collections'
import { matcher } from '#/lib/shared/search'
import type { Balance } from '#/lib/people/owed'
import { listPagePending } from '#/components/layout/page-pending'
import { Revealed } from '#/components/lists/revealed'

export const Route = createFileRoute('/_authed/settings/people')({
  ...listPagePending((t) => t('people.title')),
  loader: async () => {
    const [people, balances] = await Promise.all([getPeople(), getBalances()])
    return { ...people, balances }
  },
  component: People,
})

const parseTab = oneOf(PEOPLE_TABS)
const parseSort = oneOf(PEOPLE_SORTS)
const PANEL_ID = 'people-panel'

function AddMenu() {
  const { t } = useTranslation()
  return (
    <FloatingAddButton
      label={t('common.add')}
      options={[
        {
          to: '/settings/people/new',
          label: t('people.addPerson'),
          icon: 'user',
        },
        {
          to: '/settings/people/groups/new',
          label: t('people.addGroup'),
          icon: 'users',
        },
      ]}
    />
  )
}

function PersonRows({
  people,
  groups,
  balances,
}: {
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
  balances: Record<string, Balance>
}) {
  const locale = useFormatLocale()
  return people.map((person) => (
    <PeopleRow
      key={person.id}
      kind="person"
      row={person}
      details={namesOf(person.groupIds, groups, locale)}
      memberNames={[]}
      aside={
        person.archivedOn ? (
          <ArchivedOn date={person.archivedOn} />
        ) : (
          <OwedTag balance={balances[person.id]} />
        )
      }
    />
  ))
}

function GroupRows({
  groups,
  people,
}: {
  groups: ReadonlyArray<PersonGroup>
  people: ReadonlyArray<Person>
}) {
  const locale = useFormatLocale()
  return withMemberNames(groups, people, locale).map((group) => (
    <PeopleRow
      key={group.id}
      kind="group"
      row={group}
      details={group.memberNames.join(', ')}
      memberNames={group.memberNames}
      aside={group.archivedOn && <ArchivedOn date={group.archivedOn} />}
    />
  ))
}

/** One tab's list: the active rows, then the archived ones collapsed under them. */
function TabPanel<T extends { name: string; archivedOn: string | null }>({
  all,
  query,
  sort,
  empty,
  archivedLabel,
  storageKey,
  rows,
}: {
  all: ReadonlyArray<T>
  query: string
  sort: PeopleSort
  empty: string
  archivedLabel: (count: number) => string
  storageKey: string
  rows: (items: ReadonlyArray<T>) => React.ReactNode
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  if (all.length === 0) return <EmptyState>{empty}</EmptyState>
  const matches = matcher(query)
  const sorted = byName(
    all.filter((item) => matches(item.name)),
    locale,
  )
  const shown = sort === 'nameDesc' ? sorted.reverse() : sorted
  const active = shown.filter((item) => !item.archivedOn)
  const archived = shown.filter((item) => item.archivedOn)
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
  return (
    <>
      {active.length > 0 && (
        <ListCard>
          <Revealed items={active}>{rows}</Revealed>
        </ListCard>
      )}
      {archived.length > 0 && (
        <CollapsedSection
          label={archivedLabel(archived.length)}
          storageKey={storageKey}
        >
          <Revealed items={archived}>{rows}</Revealed>
        </CollapsedSection>
      )}
    </>
  )
}

function People() {
  const { t } = useTranslation()
  const { people, groups, balances } = Route.useLoaderData()
  const [tab, setTab] = useStoredState<PeopleTab>(
    'people.tab',
    'people',
    parseTab,
  )
  const [query, setQuery] = useState('')
  const [sort, setSort] = useStoredState<PeopleSort>(
    'people.sort',
    'nameAsc',
    parseSort,
  )

  return (
    <ListPage
      title={t('people.title')}
      actions={
        <SortMenu
          sort={sort}
          options={PEOPLE_SORTS}
          labelOf={(option) => t(`people.sort.${option}`)}
          onChange={setSort}
        />
      }
    >
      <SearchField value={query} onChange={setQuery} />
      <TabList
        label={t('people.tabsLabel')}
        tabs={PEOPLE_TABS}
        value={tab}
        labelOf={(value) => t(`people.tabs.${value}`)}
        panelId={PANEL_ID}
        idPrefix="people-tab"
        onSelect={setTab}
      />
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`people-tab-${tab}`}
        className="flex flex-col gap-4"
      >
        {tab === 'people' ? (
          <TabPanel
            all={people}
            query={query}
            sort={sort}
            empty={t('people.empty')}
            archivedLabel={(count) => t('people.archivedPeople', { count })}
            storageKey="people.archivedExpanded"
            rows={(items) => (
              <PersonRows people={items} groups={groups} balances={balances} />
            )}
          />
        ) : (
          <TabPanel
            all={groups}
            query={query}
            sort={sort}
            empty={t('people.emptyGroups')}
            archivedLabel={(count) => t('people.archivedGroups', { count })}
            storageKey="people.archivedGroupsExpanded"
            rows={(items) => <GroupRows groups={items} people={people} />}
          />
        )}
      </div>
      <AddMenu />
      {/* The person and group forms open here as sheets. */}
      <Outlet />
    </ListPage>
  )
}

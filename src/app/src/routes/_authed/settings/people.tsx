import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddButton } from '#/components/floating-add-button'
import { EmptyState, ListCard } from '#/components/list-card'
import { ListPage } from '#/components/list-page'
import { ArchivedOn, ArchivedPeople } from '#/components/people/archived-people'
import { PeopleRow } from '#/components/people/people-row'
import { SearchField } from '#/components/search-field'
import { SortMenu } from '#/components/sort-menu'
import { TabList } from '#/components/tab-list'
import {
  PEOPLE_SORTS,
  PEOPLE_TABS,
  byName,
  namesOf,
  withMemberNames,
} from '#/lib/people'
import type { PeopleSort, PeopleTab, Person, PersonGroup } from '#/lib/people'
import { useFormatLocale } from '#/lib/use-locale'
import { useStoredState } from '#/lib/use-stored-state'
import { foldForSearch, oneOf } from '#/lib/utils'
import { getPeople } from '#/server/people'

export const Route = createFileRoute('/_authed/settings/people')({
  loader: () => getPeople(),
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
}: {
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
}) {
  const locale = useFormatLocale()
  return people.map((person) => (
    <PeopleRow
      key={person.id}
      kind="person"
      row={person}
      details={namesOf(person.groupIds, groups, locale)}
      memberNames={[]}
      aside={person.archivedOn && <ArchivedOn date={person.archivedOn} />}
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
  const q = foldForSearch(query)
  const sorted = byName(
    all.filter((item) => foldForSearch(item.name).includes(q)),
    locale,
  )
  const shown = sort === 'nameDesc' ? sorted.reverse() : sorted
  const active = shown.filter((item) => !item.archivedOn)
  const archived = shown.filter((item) => item.archivedOn)
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
  return (
    <>
      {active.length > 0 && <ListCard>{rows(active)}</ListCard>}
      {archived.length > 0 && (
        <ArchivedPeople
          label={archivedLabel(archived.length)}
          storageKey={storageKey}
        >
          {rows(archived)}
        </ArchivedPeople>
      )}
    </>
  )
}

function People() {
  const { t } = useTranslation()
  const { people, groups } = Route.useLoaderData()
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
            rows={(items) => <PersonRows people={items} groups={groups} />}
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
      {/* The person and group forms open here as sheets (spec 19). */}
      <Outlet />
    </ListPage>
  )
}

import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CollapsedSection } from '#/components/lists/collapsed-section'
import { EventRow, TypeRow } from '#/components/events/list/event-row'
import { FloatingAddButton } from '#/components/layout/floating-add-button'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { ListPage } from '#/components/layout/list-page'
import { SearchField } from '#/components/forms/search-field'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import {
  EVENT_SORTS,
  EVENT_TABS,
  TYPE_SORTS,
  isPast,
  sortEvents,
} from '#/lib/events/event'
import type {
  EventItem,
  EventSort,
  EventTab,
  TypeSort,
} from '#/lib/events/event'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getEvents } from '#/server/events'
import { getPeople } from '#/server/people'
import { getCategories } from '#/server/categories'
import { DefaultSkips } from '#/components/events/list/default-skips'
import { byName, oneOf } from '#/lib/shared/collections'
import { todayIso } from '#/lib/shared/format'
import { matcher } from '#/lib/shared/search'
import { listPagePending } from '#/components/layout/page-pending'
import { Revealed } from '#/components/lists/revealed'

export const Route = createFileRoute('/_authed/settings/events')({
  ...listPagePending((t) => t('events.title')),
  loader: async () => {
    const [events, people, categories] = await Promise.all([
      getEvents(),
      getPeople(),
      getCategories(),
    ])
    return {
      ...events,
      people: people.people,
      groups: people.groups,
      categories,
    }
  },
  component: Events,
})

const parseTab = oneOf(EVENT_TABS)
const parseSort = oneOf(EVENT_SORTS)
const parseTypeSort = oneOf(TYPE_SORTS)
const PANEL_ID = 'events-panel'

function AddMenu() {
  const { t } = useTranslation()
  return (
    <FloatingAddButton
      label={t('common.add')}
      options={[
        {
          to: '/settings/events/new',
          label: t('events.addEvent'),
          icon: 'calendar',
        },
        {
          to: '/settings/events/types/new',
          label: t('events.addType'),
          icon: 'tags',
        },
      ]}
    />
  )
}

/** The current events, then the past ones collapsed under them (EVT-02). */
function EventList({ query, sort }: { query: string; sort: EventSort }) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { events, types, people } = Route.useLoaderData()
  if (events.length === 0) return <EmptyState>{t('events.empty')}</EmptyState>
  const matches = matcher(query)
  const shown = sortEvents(
    events.filter((e) => matches(e.name)),
    sort,
    locale,
  )
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
  const today = todayIso()
  const rows = (list: ReadonlyArray<EventItem>) =>
    list.map((event) => (
      <EventRow
        key={event.id}
        event={event}
        type={types.find((x) => x.id === event.typeId)}
        people={people}
      />
    ))
  const current = shown.filter((e) => !isPast(e, today))
  const past = shown.filter((e) => isPast(e, today))
  return (
    <>
      {current.length > 0 && (
        <ListCard>
          <Revealed items={current}>{rows}</Revealed>
        </ListCard>
      )}
      {past.length > 0 && (
        <CollapsedSection
          label={t('events.pastEvents', { count: past.length })}
          storageKey="events.pastExpanded"
        >
          <Revealed items={past}>{rows}</Revealed>
        </CollapsedSection>
      )}
    </>
  )
}

function TypeList({ query, sort }: { query: string; sort: TypeSort }) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { types } = Route.useLoaderData()
  if (types.length === 0)
    return <EmptyState>{t('events.emptyTypes')}</EmptyState>
  const matches = matcher(query)
  const named = byName(
    types.filter((type) => matches(type.name)),
    locale,
  )
  const shown = sort === 'nameDesc' ? named.reverse() : named
  if (shown.length === 0) return <EmptyState>{t('common.noMatch')}</EmptyState>
  return (
    <ListCard>
      <Revealed items={shown}>
        {(revealed) =>
          revealed.map((type) => <TypeRow key={type.id} type={type} />)
        }
      </Revealed>
    </ListCard>
  )
}

/** Each list keeps its sort; the settings tab has none. */
function SortFor({
  tab,
  sort,
  typeSort,
  onSort,
  onTypeSort,
}: {
  tab: EventTab
  sort: EventSort
  typeSort: TypeSort
  onSort: (sort: EventSort) => void
  onTypeSort: (sort: TypeSort) => void
}) {
  const { t } = useTranslation()
  if (tab === 'settings') return null
  return tab === 'events' ? (
    <SortMenu
      sort={sort}
      options={EVENT_SORTS}
      labelOf={(option) => t(`events.sort.${option}`)}
      onChange={onSort}
    />
  ) : (
    <SortMenu
      sort={typeSort}
      options={TYPE_SORTS}
      labelOf={(option) => t(`events.sort.${option}`)}
      onChange={onTypeSort}
    />
  )
}

function SkipSettings() {
  const { categories, defaultSkipIds } = Route.useLoaderData()
  return <DefaultSkips categories={categories} saved={defaultSkipIds} />
}

function Events() {
  const { t } = useTranslation()
  const [tab, setTab] = useStoredState<EventTab>(
    'events.tab',
    'events',
    parseTab,
  )
  const [query, setQuery] = useState('')
  const [sort, setSort] = useStoredState<EventSort>(
    'events.sort',
    'dateDesc',
    parseSort,
  )
  const { events, types } = Route.useLoaderData()
  const [typeSort, setTypeSort] = useStoredState<TypeSort>(
    'events.typeSort',
    'nameAsc',
    parseTypeSort,
  )

  return (
    <ListPage
      title={t('events.title')}
      count={
        { events: events.length, types: types.length, settings: null }[tab]
      }
      actions={
        <SortFor
          tab={tab}
          sort={sort}
          typeSort={typeSort}
          onSort={setSort}
          onTypeSort={setTypeSort}
        />
      }
    >
      {tab !== 'settings' && <SearchField value={query} onChange={setQuery} />}
      <TabList
        label={t('events.tabsLabel')}
        tabs={EVENT_TABS}
        value={tab}
        labelOf={(value) => t(`events.tabs.${value}`)}
        panelId={PANEL_ID}
        idPrefix="events-tab"
        onSelect={setTab}
      />
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`events-tab-${tab}`}
        className="flex flex-col gap-4"
      >
        {tab === 'events' && <EventList query={query} sort={sort} />}
        {tab === 'types' && <TypeList query={query} sort={typeSort} />}
        {tab === 'settings' && <SkipSettings />}
      </div>
      <AddMenu />
      {/* The event and type forms open here as sheets. */}
      <Outlet />
    </ListPage>
  )
}

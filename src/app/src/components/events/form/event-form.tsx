import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PeoplePick, TypeField } from '#/components/events/form/event-fields'
import { EventSkipField } from '#/components/events/form/skip-pick'
import type { Ids } from '#/components/events/form/event-fields'
import { CheckboxField } from '#/components/forms/checkbox-field'
import { DateRangeField } from '#/components/forms/date-range-field'
import { FormField } from '#/components/forms/form-field'
import { InfoTooltip } from '#/components/forms/info-tooltip'
import { LinkedFields } from '#/components/forms/linked-fields'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useMarkChanged } from '#/hooks/forms/use-sheet'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
import type { Category } from '#/lib/categories/category'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Person, PersonGroup } from '#/lib/people/person'
import { fromRange, toRange } from '#/lib/shared/date-range'
import { nameSchema } from '#/lib/shared/validation'
import { saveEvent } from '#/server/events'

const schema = z.object({ name: nameSchema })

function startValues(row: EventItem | null) {
  return {
    name: row?.name ?? '',
    range: toRange(row?.startsOn ?? null, row?.endsOn ?? null),
    typeId: row?.typeId ?? null,
    personIds: row?.personIds ?? ([] as Ids),
    autoLink: row?.autoLink ?? true,
    skipIds: row ? row.skipCategoryIds : null,
  }
}

/** A value the form holds, whose changes mark the sheet as changed. */
function useChanging<T>(initial: T) {
  const markChanged = useMarkChanged()
  const [value, set] = useState(initial)
  return [
    value,
    (next: T) => {
      markChanged()
      set(next)
    },
  ] as const
}

/** Under the dates: the link by date, and under it the categories it leaves out. */
function AutoLinkFields({
  on,
  onToggle,
  categories,
  defaultSkipIds,
  skipIds,
  onSkipChange,
}: {
  on: boolean
  onToggle: (on: boolean) => void
  categories: ReadonlyArray<Category>
  defaultSkipIds: Ids
  skipIds: Ids | null
  onSkipChange: (ids: Ids | null) => void
}) {
  const { t } = useTranslation()
  return (
    <LinkedFields>
      <CheckboxField
        name="autoLink"
        label={t('events.autoLink')}
        checked={on}
        onCheckedChange={onToggle}
      />
      {on && (
        <LinkedFields>
          <EventSkipField
            categories={categories}
            defaultIds={defaultSkipIds}
            own={skipIds}
            onChange={onSkipChange}
          />
        </LinkedFields>
      )}
    </LinkedFields>
  )
}

/**
 * EVT-02, EVT-07: name, type, dates, the categories the link skips, and people. No date is required; the
 * dates link the transactions in them. What an event cost is a later view (EVT-04, 05).
 */
export function EventForm({
  row,
  types,
  people,
  groups,
  categories,
  defaultSkipIds,
  savedText,
}: {
  row: EventItem | null
  types: ReadonlyArray<EventType>
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
  categories: ReadonlyArray<Category>
  defaultSkipIds: Ids
  savedText: string
}) {
  const { t } = useTranslation()
  const start = startValues(row)
  const [typeId, setTypeId] = useChanging(start.typeId)
  const [range, setRange] = useChanging(start.range)
  const [personIds, setPersonIds] = useChanging(start.personIds)
  const [autoLink, setAutoLink] = useChanging(start.autoLink)
  const [skipIds, setSkipIds] = useChanging(start.skipIds)
  const form = useSheetForm({
    schema,
    initial: { name: start.name },
    save: (data) =>
      saveEvent({
        data: {
          id: row?.id,
          name: data.name,
          typeId,
          ...fromRange(range),
          personIds,
          autoLink,
          skipCategoryIds: skipIds,
        },
      }),
    savedText,
  })
  return (
    <SheetForm {...form.formProps}>
      <FormField {...form.field('name')} label={t('events.name')} required />
      <TypeField types={types} value={typeId} onChange={setTypeId} />
      <DateRangeField
        label={t('events.dates')}
        labelAddon={
          <InfoTooltip label={t('events.datesInfoLabel')}>
            {t('events.datesInfo')}
          </InfoTooltip>
        }
        value={range}
        onChange={setRange}
        clearable
      />
      <AutoLinkFields
        on={autoLink}
        onToggle={setAutoLink}
        categories={categories}
        defaultSkipIds={defaultSkipIds}
        skipIds={skipIds}
        onSkipChange={setSkipIds}
      />
      <PeoplePick
        people={people}
        groups={groups}
        picked={personIds}
        onChange={setPersonIds}
      />
    </SheetForm>
  )
}

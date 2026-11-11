import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PeoplePick, TypeField } from '#/components/events/form/event-fields'
import type { Ids } from '#/components/events/form/event-fields'
import { CheckboxField } from '#/components/forms/checkbox-field'
import { DateRangeField } from '#/components/forms/date-range-field'
import { FormField } from '#/components/forms/form-field'
import { InfoTooltip } from '#/components/forms/info-tooltip'
import { SheetForm } from '#/components/sheet/sheet-form'
import { useMarkChanged } from '#/hooks/forms/use-sheet'
import { useSheetForm } from '#/hooks/forms/use-sheet-form'
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

/**
 * EVT-02, EVT-07 (spec 22): name, type, dates and people. No date is required; the
 * dates link the transactions in them. What an event cost is spec 23's view.
 */
export function EventForm({
  row,
  types,
  people,
  groups,
  savedText,
}: {
  row: EventItem | null
  types: ReadonlyArray<EventType>
  people: ReadonlyArray<Person>
  groups: ReadonlyArray<PersonGroup>
  savedText: string
}) {
  const { t } = useTranslation()
  const start = startValues(row)
  const [typeId, setTypeId] = useChanging(start.typeId)
  const [range, setRange] = useChanging(start.range)
  const [personIds, setPersonIds] = useChanging(start.personIds)
  const [autoLink, setAutoLink] = useChanging(start.autoLink)
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
      <CheckboxField
        name="autoLink"
        label={t('events.autoLink')}
        checked={autoLink}
        onCheckedChange={setAutoLink}
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

import { useContext, useEffect, useRef } from 'react'
import { endOfMonth, toCalendarDate, today } from '@internationalized/date'
import type { CalendarDate, DateValue } from '@internationalized/date'
import { useDateFormatter } from 'react-aria'
import {
  Button,
  CalendarStateContext,
  RangeCalendarStateContext,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import {
  focusRing,
  pickerHeader,
  pickerHeading,
  pickerNav,
} from '#/components/styles'
import { cn } from '#/lib/utils'

// The calendar's month and year, as in the M3 docked date picker: each steps with its
// arrows, and its name opens a list to pick from in place of the grid.

export type CalendarMenu = 'month' | 'year' | null

/** The calendar's state, whichever kind of calendar this grid is in. */
function useCalendarState() {
  const single = useContext(CalendarStateContext)
  const range = useContext(RangeCalendarStateContext)
  const state = single ?? range
  if (!state) throw new Error('CalendarMonthGrid needs a Calendar')
  return state
}

/** The day kept within the calendar's limits, so a month or year jump never lands outside them. */
function within(
  date: CalendarDate,
  min?: DateValue | null,
  max?: DateValue | null,
) {
  if (min && date.compare(min) < 0) return toCalendarDate(min)
  if (max && date.compare(max) > 0) return toCalendarDate(max)
  return date
}

/** The month or the year, whose name opens the list to pick from. */
function MenuButton({
  label,
  name,
  open,
  onOpen,
}: {
  label: string
  /** What the label opens, read aloud: "Mois : novembre". */
  name: string
  open: boolean
  onOpen: () => void
}) {
  return (
    <Button
      slot={null}
      aria-label={name}
      aria-expanded={open}
      onPress={onOpen}
      className={cn(
        'flex h-8 items-center gap-0.5 rounded-full pr-1 pl-2 hover:bg-secondary',
        open && 'bg-secondary',
        pickerHeading,
        focusRing,
      )}
    >
      {label}
      <Icon
        name="chevron-down"
        className={cn('size-4 transition-transform', open && 'rotate-180')}
      />
    </Button>
  )
}

/** The months or the years as a list, the shown one ticked and scrolled into view. */
function ChoiceList({
  label,
  choices,
  onPick,
}: {
  label: string
  choices: ReadonlyArray<{
    value: number
    label: string
    current: boolean
    disabled: boolean
  }>
  onPick: (value: number) => void
}) {
  const list = useRef<HTMLUListElement>(null)
  const current = useRef<HTMLButtonElement>(null)
  // The list scrolls itself; scrollIntoView would move the sheet behind it too.
  useEffect(() => {
    const [box, item] = [list.current, current.current]
    if (box && item)
      box.scrollTop =
        item.offsetTop - (box.clientHeight - item.clientHeight) / 2
  }, [])
  return (
    <ul
      ref={list}
      aria-label={label}
      className="relative h-72 overflow-y-auto py-1"
    >
      {choices.map((choice) => (
        <li key={choice.value}>
          <button
            ref={choice.current ? current : undefined}
            type="button"
            disabled={choice.disabled}
            aria-current={choice.current || undefined}
            onClick={() => onPick(choice.value)}
            className={cn(
              'flex h-12 w-full items-center gap-3 px-4 text-left capitalize hover:bg-secondary disabled:pointer-events-none disabled:opacity-40',
              choice.current && 'bg-secondary font-semibold',
              focusRing,
            )}
          >
            <Icon
              name="check"
              className={cn('size-5', !choice.current && 'invisible')}
            />
            {choice.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The shown month and year, and the jumps between them, kept within the calendar's limits. */
function useMonthYear() {
  const state = useCalendarState()
  const { timeZone, minValue, maxValue } = state
  const shortMonth = useDateFormatter({ month: 'short', timeZone })
  const longMonth = useDateFormatter({ month: 'long', timeZone })
  const focused = state.focusedDate
  const nameOf = (month: number) =>
    longMonth.format(focused.set({ month, day: 1 }).toDate(timeZone))
  const outside = (first: CalendarDate, last: CalendarDate) =>
    Boolean(
      (maxValue && first.compare(maxValue) > 0) ||
      (minValue && last.compare(minValue) < 0),
    )
  const thisYear = today(timeZone).year
  const firstYear = minValue?.year ?? thisYear - 60
  const lastYear = maxValue?.year ?? thisYear + 10
  return {
    focused,
    shortName: shortMonth.format(focused.toDate(timeZone)),
    nameOf,
    go: (date: CalendarDate) =>
      state.setFocusedDate(within(date, minValue, maxValue)),
    months: Array.from({ length: 12 }, (_, i) => {
      const first = focused.set({ month: i + 1, day: 1 })
      return {
        value: i + 1,
        label: nameOf(i + 1),
        current: i + 1 === focused.month,
        disabled: outside(first, endOfMonth(first)),
      }
    }),
    years: Array.from({ length: lastYear - firstYear + 1 }, (_, i) => ({
      value: firstYear + i,
      label: String(firstYear + i),
      current: firstYear + i === focused.year,
      disabled: false,
    })),
  }
}

/** One pair of arrows steps month by month; the names between them open their lists. */
export function MonthYearHeader({
  menu,
  onMenu,
}: {
  menu: CalendarMenu
  onMenu: (menu: CalendarMenu) => void
}) {
  const { t } = useTranslation()
  const { focused, shortName, nameOf } = useMonthYear()
  // Hidden, not removed, while a list is open, so the names stay in place.
  const arrow = cn(pickerNav, menu && 'invisible')
  // Only set while a list is open: a false here would override the calendar's own limit
  // (no month past maxValue).
  const blocked = menu ? true : undefined
  return (
    <header className={pickerHeader}>
      <Button slot="previous" className={arrow} isDisabled={blocked}>
        <Icon name="chevron-left" />
      </Button>
      <div className="flex items-center gap-1">
        <MenuButton
          label={shortName}
          name={t('common.monthName', { name: nameOf(focused.month) })}
          open={menu === 'month'}
          onOpen={() => onMenu(menu === 'month' ? null : 'month')}
        />
        <MenuButton
          label={String(focused.year)}
          name={t('common.yearName', { name: focused.year })}
          open={menu === 'year'}
          onOpen={() => onMenu(menu === 'year' ? null : 'year')}
        />
      </div>
      <Button slot="next" className={arrow} isDisabled={blocked}>
        <Icon name="chevron-right" />
      </Button>
    </header>
  )
}

/** The open list: a pick moves the calendar there and closes it. */
export function MonthYearList({
  menu,
  onPicked,
}: {
  menu: 'month' | 'year'
  onPicked: () => void
}) {
  const { t } = useTranslation()
  const { focused, go, months, years } = useMonthYear()
  return (
    <ChoiceList
      key={menu}
      label={t(menu === 'month' ? 'common.month' : 'common.year')}
      choices={menu === 'month' ? months : years}
      onPick={(value) => {
        go(focused.set(menu === 'month' ? { month: value } : { year: value }))
        onPicked()
      }}
    />
  )
}

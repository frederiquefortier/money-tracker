import { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import type { ComboboxRow } from '#/hooks/forms/use-combobox'
import {
  GroupHeading,
  OptionContent,
} from '#/components/combobox/combobox-option'
import { PopoverContent } from '#/components/ui/popover'
import { useOverlayContainer } from '#/components/ui/overlay-container'
import { treeGuides } from '#/lib/shared/tree-layout'
import { cn } from '#/lib/utils'
import { useRevealed } from '#/hooks/app/use-revealed'
import { fieldSurface } from '#/components/styles'

// The chosen option is tinted, as in a native select; hover and the keyboard's position
// are grey so the two never look alike.
function optionClass(row: ComboboxRow, selected: boolean, active: boolean) {
  return cn(
    'flex cursor-pointer items-center gap-2 rounded-field px-2 py-2',
    selected && 'bg-accent font-semibold text-accent-foreground',
    'hover:bg-muted',
    active && 'bg-muted',
    row.kind === 'create' && 'font-semibold text-primary',
    // Options under a heading sit one step in, so the heading reads as their parent.
    row.kind === 'option' && row.option.group !== undefined && 'pl-6',
  )
}

export function ComboboxList({
  id,
  rows,
  active,
  value,
  query,
  createLabel,
  onPick,
}: {
  id: string
  rows: ReadonlyArray<ComboboxRow>
  active: number
  value: string | null
  query: string
  createLabel?: (text: string) => string
  onPick: (row: ComboboxRow) => void
}) {
  const guides = treeGuides(
    rows.map((row) => (row.kind === 'option' ? (row.option.depth ?? 0) : 0)),
  )
  // Options build as the list scrolls; the keyboard's position is always built.
  const revealed = useRevealed<ComboboxRow, HTMLLIElement>(rows, 60, active + 1)
  // The keyboard's position stays in view as it moves down a long list.
  useEffect(() => {
    if (active < 0) return
    document
      .getElementById(`${id}-${active}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [id, active])
  return (
    <ul
      id={id}
      role="listbox"
      className="max-h-[min(18rem,calc(var(--radix-popper-available-height)-0.5rem))] overflow-y-auto"
    >
      {revealed.shown.map((row, i) => {
        const group = row.kind === 'option' ? row.option.group : undefined
        const previous = i > 0 ? rows[i - 1] : undefined
        const newGroup =
          group !== undefined &&
          (previous?.kind !== 'option' || previous.option.group !== group)
        const selected = row.kind === 'option' && row.option.value === value
        return (
          <Fragment
            key={
              row.kind === 'option'
                ? `${group ?? ''}:${row.option.value}`
                : 'create'
            }
          >
            {newGroup && <GroupHeading>{group}</GroupHeading>}
            <li
              id={`${id}-${i}`}
              role="option"
              aria-selected={selected}
              // Keep focus in the input while choosing with the mouse.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(row)}
              className={optionClass(row, selected, i === active)}
            >
              {row.kind === 'option' ? (
                <OptionContent option={row.option} guide={guides[i]} />
              ) : (
                <>
                  <Icon name="plus" className="size-4" />
                  {createLabel?.(query.trim())}
                </>
              )}
            </li>
          </Fragment>
        )
      })}
      {revealed.more && <li ref={revealed.sentinel} aria-hidden="true" />}
    </ul>
  )
}

/** The list as a popover under the field; typing or tapping in the field does not close it. */
export function ComboboxPopup({
  label,
  anchor,
  ...list
}: {
  label: string
  anchor: React.RefObject<HTMLElement | null>
} & React.ComponentProps<typeof ComboboxList>) {
  const { t } = useTranslation()
  const panel = useOverlayContainer()
  return (
    <PopoverContent
      // The list flips and shrinks against the sheet, which follows the visible area
      // (the keyboard excluded), not the page behind it.
      collisionBoundary={panel ?? undefined}
      collisionPadding={8}
      className={cn('w-(--radix-popper-anchor-width) p-1', fieldSurface)}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onInteractOutside={(event) => {
        const target = event.target as Node | null
        if (anchor.current?.contains(target)) event.preventDefault()
      }}
      aria-label={t('common.suggestions', { label })}
    >
      <ComboboxList {...list} />
    </PopoverContent>
  )
}

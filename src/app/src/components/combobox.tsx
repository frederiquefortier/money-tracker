import { Fragment, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { useCombobox } from '#/components/use-combobox'
import type { ComboboxOption, Row } from '#/components/use-combobox'
import { GroupHeading, OptionContent } from '#/components/combobox-option'
import { SelectChevron } from '#/components/select-field'
import { Tag } from '#/components/tag'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import { Popover, PopoverAnchor, PopoverContent } from '#/components/ui/popover'
import { treeGuides } from '#/lib/tree'
import { cn, focusRing } from '#/lib/utils'

function ComboboxList({
  id,
  rows,
  active,
  value,
  query,
  createLabel,
  onPick,
}: {
  id: string
  rows: ReadonlyArray<Row>
  active: number
  value: string | null
  query: string
  createLabel?: (text: string) => string
  onPick: (row: Row) => void
}) {
  const guides = treeGuides(
    rows.map((row) => (row.kind === 'option' ? (row.option.depth ?? 0) : 0)),
  )
  return (
    <ul id={id} role="listbox" className="max-h-72 overflow-y-auto">
      {rows.map((row, i) => {
        const group = row.kind === 'option' ? row.option.group : undefined
        const previous = i > 0 ? rows[i - 1] : undefined
        const newGroup =
          group !== undefined &&
          (previous?.kind !== 'option' || previous.option.group !== group)
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
              aria-selected={
                row.kind === 'option' && row.option.value === value
              }
              // Keep focus in the input while choosing with the mouse.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(row)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2',
                'hover:bg-accent hover:text-accent-foreground',
                i === active && 'bg-accent text-accent-foreground',
                row.kind === 'create' && 'font-semibold text-primary',
              )}
            >
              {row.kind === 'option' ? (
                <OptionContent
                  option={row.option}
                  selected={row.option.value === value}
                  guide={guides[i]}
                />
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
    </ul>
  )
}

type ComboboxState = ReturnType<typeof useCombobox>

// PopoverAnchor (asChild) passes a ref and props: the wrapper must take them, or Radix
// has nothing to anchor the list to.
function ComboboxInput({
  id,
  listId,
  state,
  hasValue,
  clearLabel,
  onClear,
  ...anchor
}: React.ComponentProps<'div'> & {
  id: string
  listId: string
  state: ComboboxState
  hasValue: boolean
  clearLabel: string
  onClear: () => void
}) {
  return (
    <div {...anchor} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={state.expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          state.expanded && state.active >= 0
            ? `${listId}-${state.active}`
            : undefined
        }
        autoComplete="off"
        value={state.text}
        onChange={(event) => state.onType(event.target.value)}
        onFocus={() => state.setOpen(true)}
        onClick={() => state.setOpen(true)}
        onBlur={state.onBlur}
        onKeyDown={state.onKeyDown}
        className={cn(
          fieldControl,
          hasValue ? 'pr-16' : 'pr-9',
          state.tag && 'pr-36',
        )}
      />
      {state.tag && (
        <Tag className="pointer-events-none absolute top-1/2 right-16 -translate-y-1/2">
          {state.tag}
        </Tag>
      )}
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          title={clearLabel}
          className={cn(
            'absolute top-1/2 right-8 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground',
            focusRing,
          )}
        >
          <Icon name="close" className="size-4" />
        </button>
      )}
      <SelectChevron />
    </div>
  )
}

/**
 * A single choice typed into the field itself (WAI-ARIA combobox): arrows move, Enter
 * picks, Escape closes. With `onCreate`, what was typed can become a new option. The list
 * is a popover anchored to the field, so a scrolling sheet cannot clip it.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  required = false,
  clearLabel,
  createLabel,
  onCreate,
}: {
  label: string
  options: ReadonlyArray<ComboboxOption>
  value: string | null
  onChange: (value: string | null) => void
  required?: boolean
  clearLabel: string
  createLabel?: (text: string) => string
  onCreate?: (text: string) => void
}) {
  const { t } = useTranslation()
  const inputId = useId()
  const listId = useId()
  const state = useCombobox({
    options,
    value,
    onChange,
    onCreate,
  })
  const anchorRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <Popover open={state.expanded} onOpenChange={state.setOpen}>
        <PopoverAnchor asChild>
          <ComboboxInput
            ref={anchorRef}
            id={inputId}
            listId={listId}
            state={state}
            hasValue={value !== null}
            clearLabel={clearLabel}
            onClear={() => onChange(null)}
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-(--radix-popper-anchor-width) p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          // The field is outside the list; typing or clicking in it must not close it.
          onInteractOutside={(event) => {
            const target = event.target as Node | null
            if (anchorRef.current?.contains(target)) event.preventDefault()
          }}
          aria-label={t('common.suggestions', { label })}
        >
          <ComboboxList
            id={listId}
            rows={state.rows}
            active={state.active}
            value={value}
            query={state.query}
            createLabel={createLabel}
            onPick={state.pick}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

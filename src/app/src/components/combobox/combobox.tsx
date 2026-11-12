import { useId, useRef } from 'react'
import { Icon } from '#/components/display/icon'
import { useCombobox } from '#/hooks/forms/use-combobox'
import type { ComboboxOption } from '#/hooks/forms/use-combobox'
import { ComboboxPopup } from '#/components/combobox/combobox-list'
import { FieldMessage } from '#/components/forms/form-field'
import { SelectChevron } from '#/components/forms/select-field'
import { Tag } from '#/components/display/tag'
import { FieldLabel, fieldControl } from '#/components/ui/field'
import { Popover, PopoverAnchor } from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'
import { isTouchDevice } from '#/lib/shared/touch'

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
  errorId,
  inputRef,
  ...anchor
}: React.ComponentProps<'div'> & {
  inputRef: React.Ref<HTMLInputElement>
  id: string
  listId: string
  state: ComboboxState
  hasValue: boolean
  clearLabel: string
  onClear: () => void
  errorId?: string
}) {
  return (
    <div {...anchor} className="relative">
      <input
        ref={inputRef}
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
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
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
          // The field keeps the focus: a tap would otherwise close the list first, and the
          // layout moving under the finger would lose the click.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          aria-label={clearLabel}
          title={clearLabel}
          className={cn(
            'absolute top-1/2 right-8 -translate-y-1/2 rounded-field p-1 text-muted-foreground hover:text-foreground',
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
  hideLabel = false,
  clearLabel,
  createLabel,
  onCreate,
  typedOrder,
  error,
}: {
  label: string
  options: ReadonlyArray<ComboboxOption>
  value: string | null
  onChange: (value: string | null) => void
  required?: boolean
  /** The label stays for screen readers, when something above already names the field. */
  hideLabel?: boolean
  clearLabel: string
  createLabel?: (text: string) => string
  onCreate?: (text: string) => void
  /** How matches are ordered while typing, when not as listed (merchants: by name). */
  typedOrder?: (a: ComboboxOption, b: ComboboxOption) => number
  /** A validation message under the field (SET-07). */
  error?: string
}) {
  const inputId = useId()
  const listId = useId()
  const state = useCombobox({ options, value, onChange, onCreate, typedOrder })
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={inputId}
        required={required}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
      </FieldLabel>
      <Popover open={state.expanded} onOpenChange={state.setOpen}>
        <PopoverAnchor asChild>
          <ComboboxInput
            ref={anchorRef}
            inputRef={inputRef}
            id={inputId}
            listId={listId}
            errorId={error ? `${inputId}-error` : undefined}
            state={state}
            hasValue={value !== null}
            clearLabel={clearLabel}
            onClear={state.clear}
          />
        </PopoverAnchor>
        <ComboboxPopup
          label={label}
          anchor={anchorRef}
          id={listId}
          rows={state.rows}
          active={state.active}
          value={value}
          query={state.query}
          createLabel={createLabel}
          onPick={(row) => {
            state.pick(row)
            // A phone keeps its keyboard up while the field has the focus.
            if (isTouchDevice()) inputRef.current?.blur()
          }}
        />
      </Popover>
      {error && <FieldMessage id={`${inputId}-error`}>{error}</FieldMessage>}
    </div>
  )
}

import { useState } from 'react'
import { useMarkChanged } from '#/components/route-sheet'
import { foldForSearch } from '#/lib/utils'

/**
 * `keywords` are matched too, for what the label does not show (another language).
 * `icon` shows before the label in the list. Options with the same `group` sit together
 * under its heading. `tag` shows in
 * the field while the option is chosen. A `hidden` option can be the value but is never
 * listed (an archived category). In a tree, `depth` and `parent` (the parent option's
 * value) place the option and draw its connectors, and the list shows `short` (the name)
 * while the field shows `label` (the full path); a search keeps each match's parents.
 */
export type ComboboxOption = {
  value: string
  label: string
  keywords?: string
  icon?: React.ReactNode
  group?: string
  tag?: string
  hidden?: boolean
  /** Listed only while nothing is typed (CAT-06, Fréquentes). */
  browseOnly?: boolean
  depth?: number
  parent?: string
  short?: string
}

export type Row =
  { kind: 'option'; option: ComboboxOption } | { kind: 'create' }

/** Typing filters; the last row offers to create what was typed when nothing matches. */
function useRows(
  options: ReadonlyArray<ComboboxOption>,
  query: string,
  {
    canCreate,
    typedOrder,
  }: {
    canCreate: boolean
    typedOrder?: (a: ComboboxOption, b: ComboboxOption) => number
  },
): Array<Row> {
  const q = foldForSearch(query)
  const visible = options.filter((o) => !o.hidden && !(q && o.browseOnly))
  const keep = new Set(
    visible.filter((o) =>
      foldForSearch(`${o.short ?? o.label} ${o.keywords ?? ''}`).includes(q),
    ),
  )
  for (const match of [...keep]) {
    const parentOf = (o: ComboboxOption) =>
      visible.find((p) => p.value === o.parent && p.group === o.group)
    for (let p = parentOf(match); p; p = parentOf(p)) keep.add(p)
  }
  const matches = visible.filter((o) => keep.has(o))
  if (q && typedOrder) matches.sort(typedOrder)
  const rows: Array<Row> = matches.map((option) => ({ kind: 'option', option }))
  if (canCreate && q && !options.some((o) => foldForSearch(o.label) === q)) {
    rows.push({ kind: 'create' })
  }
  return rows
}

/** Query, highlighted row and keyboard handling for Combobox. */
export function useCombobox({
  options,
  value,
  onChange,
  onCreate,
  typedOrder,
}: {
  options: ReadonlyArray<ComboboxOption>
  value: string | null
  onChange: (value: string | null) => void
  onCreate?: (text: string) => void
  typedOrder?: (a: ComboboxOption, b: ComboboxOption) => number
}) {
  const markChanged = useMarkChanged()
  const selected = options.find((o) => o.value === value && !o.browseOnly)
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  // No highlight until the arrows move it or typing narrows the list (-1 is none).
  const [active, setActive] = useState(-1)
  const rows = useRows(options, query ?? '', {
    canCreate: Boolean(onCreate),
    typedOrder,
  })

  // A choice is a change the enclosing sheet asks about before closing.
  function choose(next: string | null) {
    markChanged()
    onChange(next)
  }

  function close() {
    setOpen(false)
    setQuery(null)
    setActive(-1)
  }

  function pick(row: Row | undefined) {
    if (!row) return
    if (row.kind === 'option') choose(row.option.value)
    else onCreate?.((query ?? '').trim())
    close()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const moves: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 }
    const move = moves[event.key]
    if (move !== undefined) {
      event.preventDefault()
      setOpen(true)
      // From no highlight, Down starts at the top and Up at the bottom.
      setActive((i) => {
        const from = i < 0 && move > 0 ? -1 : Math.max(i, 0)
        return (from + move + rows.length) % Math.max(rows.length, 1)
      })
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      pick(rows[active])
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
    }
  }

  return {
    text: query ?? selected?.label ?? '',
    tag: query === null ? selected?.tag : undefined,
    query: query ?? '',
    rows,
    active,
    expanded: open && rows.length > 0,
    setOpen,
    pick,
    clear: () => choose(null),
    onKeyDown,
    onType(text: string) {
      setQuery(text)
      setActive(0)
      setOpen(true)
    },
    onBlur() {
      // Erasing the text and leaving the field empties it.
      if (query !== null && query.trim() === '') choose(null)
      close()
    },
  }
}

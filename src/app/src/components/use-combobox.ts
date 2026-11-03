import { useState } from 'react'
import { foldForSearch } from '#/lib/utils'

/**
 * `keywords` are matched too, for what the label does not show (another language).
 * `icon` shows before the label in the list.
 */
export type ComboboxOption = {
  value: string
  label: string
  keywords?: string
  icon?: React.ReactNode
}

export type Row =
  { kind: 'option'; option: ComboboxOption } | { kind: 'create' }

/** Typing filters; the last row offers to create what was typed when nothing matches. */
function useRows(
  options: ReadonlyArray<ComboboxOption>,
  query: string,
  canCreate: boolean,
): Array<Row> {
  const q = foldForSearch(query)
  const rows: Array<Row> = options
    .filter((o) => foldForSearch(`${o.label} ${o.keywords ?? ''}`).includes(q))
    .map((option) => ({ kind: 'option', option }))
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
}: {
  options: ReadonlyArray<ComboboxOption>
  value: string | null
  onChange: (value: string | null) => void
  onCreate?: (text: string) => void
}) {
  const selected = options.find((o) => o.value === value)
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rows = useRows(options, query ?? '', Boolean(onCreate))

  function close() {
    setOpen(false)
    setQuery(null)
    setActive(0)
  }

  function pick(row: Row | undefined) {
    if (!row) return
    if (row.kind === 'option') onChange(row.option.value)
    else onCreate?.((query ?? '').trim())
    close()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const moves: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 }
    const move = moves[event.key]
    if (move !== undefined) {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (i + move + rows.length) % Math.max(rows.length, 1))
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
    query: query ?? '',
    rows,
    active,
    expanded: open && rows.length > 0,
    setOpen,
    pick,
    onKeyDown,
    onType(text: string) {
      setQuery(text)
      setActive(0)
      setOpen(true)
    },
    onBlur() {
      // Erasing the text and leaving the field empties it.
      if (query !== null && query.trim() === '') onChange(null)
      close()
    },
  }
}

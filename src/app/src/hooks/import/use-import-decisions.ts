import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { isEditKey } from '#/lib/import/import-edits'
import type { Edit } from '#/lib/import/import-edits'
import { decisionCount, NO_DECISIONS } from '#/lib/import/import-merges'
import type { Decisions } from '#/lib/import/import-merges'
import type { MergeKind } from '#/lib/import/import'

const STORAGE_KEY = 'import-decisions-v1'

const names = z.record(z.string(), z.string())
const editMap = z.record(
  z.string(),
  z.object({ name: z.string(), note: z.string() }),
)
const storedSchema = z.object({
  merges: z.object({
    categories: names,
    merchants: names,
    people: names,
    events: names,
  }),
  edits: z.object({ merchants: editMap, people: editMap, events: editMap }),
  persons: names,
})

function stored(): Decisions | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? storedSchema.safeParse(JSON.parse(raw)) : null
    return parsed?.success ? parsed.data : null
  } catch {
    return null
  }
}

function patched<T>(
  map: Partial<Record<string, T>>,
  key: string,
  value: T | null,
) {
  const { [key]: _removed, ...rest } = map
  return value === null ? rest : { ...rest, [key]: value }
}

/**
 * What the author decides about the new items (IMP-06): merge one into another name, or
 * edit it. The two exclude each other for an item. The choices take time to make, so they
 * are kept in this browser: changing a file, an error or a reload does not lose them.
 */
export function useImportDecisions() {
  const [decisions, setDecisions] = useState<Decisions>(NO_DECISIONS)
  const [restored, setRestored] = useState(false)

  // After the first render, so the server and the browser first agree.
  useEffect(() => {
    const kept = stored()
    if (kept) setDecisions(kept)
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try {
      if (decisionCount(decisions) === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions))
      }
    } catch {
      // Private window or blocked storage: the choices last as long as the page.
    }
  }, [decisions, restored])

  function setMerge(kind: MergeKind, key: string, target: string | null) {
    setDecisions(({ merges, edits, persons }) => ({
      persons: target !== null ? patched(persons, key, null) : persons,
      merges: { ...merges, [kind]: patched(merges[kind], key, target) },
      edits:
        target !== null && isEditKey(kind)
          ? { ...edits, [kind]: patched(edits[kind], key, null) }
          : edits,
    }))
  }

  function setEdit(kind: MergeKind, key: string, edit: Edit | null) {
    if (!isEditKey(kind)) return
    setDecisions(({ merges, edits, persons }) => ({
      persons: edit !== null ? patched(persons, key, null) : persons,
      edits: { ...edits, [kind]: patched(edits[kind], key, edit) },
      merges:
        edit !== null
          ? { ...merges, [kind]: patched(merges[kind], key, null) }
          : merges,
    }))
  }

  /** A note kept with a merge: it sets the edit without undoing the merge. */
  function setNote(kind: MergeKind, key: string, edit: Edit | null) {
    if (!isEditKey(kind)) return
    setDecisions((previous) => ({
      ...previous,
      edits: {
        ...previous.edits,
        [kind]: patched(previous.edits[kind], key, edit),
      },
    }))
  }

  /** A merchant text that is a person: `name` is theirs (ADR-038); null puts it back. */
  function setPerson(key: string, name: string | null) {
    setDecisions(({ merges, edits, persons }) => ({
      persons: patched(persons, key, name),
      merges:
        name !== null
          ? { ...merges, merchants: patched(merges.merchants, key, null) }
          : merges,
      edits:
        name !== null
          ? { ...edits, merchants: patched(edits.merchants, key, null) }
          : edits,
    }))
  }

  /** Every choice undone, for when they are what the check refused. */
  const reset = useCallback(() => setDecisions(NO_DECISIONS), [])

  return { decisions, setMerge, setEdit, setNote, setPerson, reset }
}

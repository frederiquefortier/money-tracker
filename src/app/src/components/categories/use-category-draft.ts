import { useState } from 'react'
import { autoColor, suggestIcon } from '#/lib/categories'
import type { Category, CategoryInput, Kind } from '#/lib/categories'

export type CategoryValues = Pick<
  Category,
  'name' | 'kind' | 'parentId' | 'icon' | 'iconIsAuto' | 'color' | 'colorIsAuto'
>

/**
 * The form's live values (spec 12). The icon follows the name until one is picked by
 * hand; a sub-category's colour follows its parent until one is picked by hand. A
 * sub-category takes its parent's kind.
 */
export function useCategoryDraft(
  id: string | undefined,
  initial: CategoryValues,
  categories: ReadonlyArray<Category>,
) {
  const [name, setName] = useState(initial.name)
  const [draft, setDraft] = useState({
    ...initial,
    handPicked: initial.parentId !== null && !initial.colorIsAuto,
  })
  const parent = categories.find((c) => c.id === draft.parentId)
  const kind: Kind = parent?.kind ?? draft.kind
  const icon = draft.iconIsAuto ? suggestIcon(name) : draft.icon
  const colorIsAuto = parent !== undefined && !draft.handPicked
  const color =
    parent && colorIsAuto
      ? autoColor(categories, { id, parentId: parent.id, name })
      : draft.color
  const update = (change: Partial<typeof draft>) =>
    setDraft((prev) => ({ ...prev, ...change }))

  return {
    name,
    kind,
    parent,
    icon,
    suggestedIcon: suggestIcon(name),
    iconIsAuto: draft.iconIsAuto,
    color,
    colorIsAuto,
    canResetColor: parent !== undefined && draft.handPicked,
    setName,
    setKind: (next: Kind) => update({ kind: next }),
    // Leaving the parent keeps the colour and kind it had.
    setParent: (parentId: string | null) =>
      update(parentId ? { parentId } : { parentId, color, kind }),
    // Picking the suggestion lets the name drive the icon again.
    pickIcon: (next: string) =>
      update({ icon: next, iconIsAuto: next === suggestIcon(name) }),
    pickColor: (next: string) => update({ color: next, handPicked: true }),
    resetColor: () => update({ handPicked: false }),
    input: (typedName: string): CategoryInput => ({
      id,
      name: typedName,
      kind,
      parentId: parent?.id ?? null,
      icon,
      iconIsAuto: draft.iconIsAuto,
      color,
      colorIsAuto,
    }),
  }
}

export type CategoryDraft = ReturnType<typeof useCategoryDraft>

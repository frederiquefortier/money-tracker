import { useMemo, useState } from 'react'
import { useImportSuggestions } from '#/hooks/import/use-import-suggestions'
import { EditSheet } from '#/components/import/edit-sheet'
import { MergeSheet } from '#/components/import/merge-sheet'
import { NewItemsSection } from '#/components/import/new-items-section'
import { isEditKey, REMOVED } from '#/lib/import/import-edits'
import type { Edit } from '#/lib/import/import-edits'
import type { Decisions } from '#/lib/import/import-merges'
import { foldName } from '#/lib/import/import-names'
import { buildSections, mergeOptions } from '#/lib/import/import-sections'
import type { Section, SectionItem } from '#/lib/import/import-sections'
import type {
  ImportInput,
  ImportTargets,
  ImportWillCreate,
  MergeKind,
} from '#/lib/import/import'

type Pending = {
  how: 'merge' | 'edit'
  section: Section
  item: SectionItem
  kind: MergeKind
}

/** A merge into a name that is neither an existing one nor another new one is a rename. */
function isRename(section: Section, item: SectionItem, targets: ImportTargets) {
  if (item.mergedInto === null) return false
  const target = foldName(item.mergedInto)
  return !mergeOptions(section, item, targets).some(
    (name) => foldName(name) === target,
  )
}

/** A renamed item is still created, so it stays in the count. */
function countWithRenames(section: Section, targets: ImportTargets) {
  return (
    section.count +
    section.items.filter((item) => isRename(section, item, targets)).length
  )
}

function PendingSheet({
  pending,
  targets,
  onMerge,
  onEdit,
  onNote,
  onClose,
}: {
  pending: Pending | null
  targets: ImportTargets
  onMerge: (kind: MergeKind, key: string, target: string | null) => void
  onEdit: (kind: MergeKind, key: string, edit: Edit | null) => void
  onNote: (kind: MergeKind, key: string, edit: Edit | null) => void
  onClose: () => void
}) {
  if (!pending) return null
  const { how, kind, item, section } = pending
  return how === 'merge' ? (
    <MergeSheet
      name={item.label}
      options={mergeOptions(section, item, targets)}
      withNote={isEditKey(kind)}
      onMerge={(target, note) => {
        onMerge(kind, item.key, target)
        if (note !== '') onNote(kind, item.key, { name: item.label, note })
        onClose()
      }}
      onClosed={onClose}
    />
  ) : (
    <EditSheet
      name={item.label}
      renameOnly={!isEditKey(kind)}
      onEdit={(edit) => {
        if (isEditKey(kind)) onEdit(kind, item.key, edit)
        else if (edit.name !== '') onMerge(kind, item.key, edit.name)
        onClose()
      }}
      onClosed={onClose}
    />
  )
}

type Decide = {
  onMerge: (kind: MergeKind, key: string, target: string | null) => void
  onEdit: (kind: MergeKind, key: string, edit: Edit | null) => void
  onPerson: (key: string, name: string | null) => void
  /** A note kept with a merge. */
  onNote: (kind: MergeKind, key: string, edit: Edit | null) => void
}

function SectionBlock({
  section,
  targets,
  similar,
  decide,
  open,
}: {
  section: Section
  targets: ImportTargets
  similar: (section: Section, item: SectionItem) => string | null
  decide: Decide
  open: (pending: Pending) => void
}) {
  const kind = section.mergeKind
  const { onMerge, onEdit, onPerson } = decide
  return (
    <NewItemsSection
      section={section}
      count={countWithRenames(section, targets)}
      renamedOf={(item) => isRename(section, item, targets)}
      onMerge={
        kind ? (item) => open({ how: 'merge', section, item, kind }) : undefined
      }
      onEdit={
        kind ? (item) => open({ how: 'edit', section, item, kind }) : undefined
      }
      onRemove={
        kind && section.editable
          ? (item) => onEdit(kind, item.key, REMOVED)
          : undefined
      }
      onPerson={
        kind === 'merchants'
          ? (item) => onPerson(item.key, item.label)
          : undefined
      }
      similarOf={
        kind
          ? (item) => {
              const name = similar(section, item)
              return name
                ? { name, onMerge: () => onMerge(kind, item.key, name) }
                : null
            }
          : undefined
      }
      onRestore={
        kind
          ? (item) => {
              onMerge(kind, item.key, null)
              onEdit(kind, item.key, null)
              onPerson(item.key, null)
            }
          : undefined
      }
    />
  )
}

/**
 * Everything new, kind by kind (spec 18), and what can be decided about each (IMP-06):
 * merge it into another name, edit it, remove it, or say a merchant is a person. The sheets
 * open from here.
 */
export function NewItemSections({
  will,
  input,
  decisions,
  targets,
  onMerge,
  onEdit,
  onPerson,
  onNote,
}: {
  will: ImportWillCreate
  input: ImportInput
  decisions: Decisions
  targets: ImportTargets
} & Decide) {
  const [pending, setPending] = useState<Pending | null>(null)
  const sections = useMemo(
    () => buildSections(will, input, decisions),
    [will, input, decisions],
  )
  const similar = useImportSuggestions(sections, targets)
  return (
    <>
      {sections.length > 0 && (
        <div className="flex flex-col gap-5 py-2">
          {sections.map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              targets={targets}
              similar={similar}
              decide={{ onMerge, onEdit, onPerson, onNote }}
              open={setPending}
            />
          ))}
        </div>
      )}
      <PendingSheet
        pending={pending}
        targets={targets}
        onMerge={onMerge}
        onEdit={onEdit}
        onNote={onNote}
        onClose={() => setPending(null)}
      />
    </>
  )
}

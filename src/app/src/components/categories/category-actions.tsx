import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormField } from '#/components/form-field'
import { IconActions, IconButton, IconLink } from '#/components/icon-button'
import type { ActionPlacement } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { useServerAction } from '#/components/use-server-action'
import { isArchived } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import { formatDate, formatQuotedList, todayIso } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import {
  addCategoryPause,
  archiveCategory,
  deleteCategory,
  reactivateCategory,
} from '#/server/categories'

type StatusMode = 'archive' | 'reactivate'

function submitStatus(
  mode: StatusMode,
  { id, from, until }: { id: string; from: string; until: string },
) {
  if (mode === 'reactivate') return reactivateCategory({ data: { id, from } })
  if (until) return addCategoryPause({ data: { id, from, until } })
  return archiveCategory({ data: { id, from } })
}

/** What else the change takes along: the archived parents, or the active branch. */
function StatusNotes({
  parents,
  branch,
}: {
  parents: ReadonlyArray<Category>
  branch: number
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (parents.length > 0)
    return (
      <p className="text-sm">
        {t('categories.reactivateParents', {
          count: parents.length,
          names: formatQuotedList(
            parents.map((p) => p.name),
            locale,
          ),
        })}
      </p>
    )
  if (branch > 0)
    return (
      <p className="text-sm">
        {t('categories.archiveBranch', { count: branch })}
      </p>
    )
  return null
}

/**
 * Archive or reactivate from a date (CAT-03); archiving takes the branch along,
 * reactivating brings back the archived parents. A reactivation date on archive makes it
 * a past period.
 */
function StatusDialog({
  category,
  parent,
  branch,
  archivedParents,
  mode,
  onClose,
}: {
  category: Category
  parent: Category | undefined
  branch: number
  archivedParents: ReadonlyArray<Category>
  mode: StatusMode
  onClose: () => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { run, busy } = useServerAction()
  const today = todayIso()
  const [from, setFrom] = useState(today)
  const [until, setUntil] = useState('')
  const { id, name } = category
  const parents = mode === 'reactivate' ? archivedParents : []
  // The parents cannot come back before they were archived either.
  const last = [category, ...parents]
    .map((c) => c.history[0]?.effectiveOn ?? '')
    .reduce((a, b) => (a > b ? a : b), '')
  const datesOk = from !== '' && (!until || until > from)

  function failureText(error: string) {
    if (error === 'parentArchived')
      return t('categories.parentArchived', { parent: parent?.name ?? '' })
    if (error === 'beforePrevious' && last)
      return t('categories.beforePrevious', { date: formatDate(last, locale) })
    if (error === 'pauseOverlaps') return t('categories.pauseOverlaps')
    return undefined
  }

  return (
    <ConfirmDialog
      open
      tone="default"
      title={t(`common.${mode}Name`, { name })}
      confirmLabel={t(`common.${mode}`)}
      busy={busy}
      canConfirm={datesOk}
      onCancel={onClose}
      onConfirm={() =>
        run(() => submitStatus(mode, { id, from, until }), {
          onResult: onClose,
          failureText,
        })
      }
    >
      <FormField
        name="from"
        type="date"
        required
        label={t('categories.from')}
        value={from}
        onChange={(event) => setFrom(event.target.value)}
      />
      {mode !== 'reactivate' && (
        <FormField
          name="until"
          type="date"
          label={t('categories.until')}
          value={until}
          min={from || undefined}
          max={today}
          onChange={(event) => setUntil(event.target.value)}
        />
      )}
      <StatusNotes parents={parents} branch={mode === 'archive' ? branch : 0} />
    </ConfirmDialog>
  )
}

function DeleteDialog({
  category,
  onClose,
}: {
  category: Category
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  return (
    <ConfirmDialog
      open
      title={t('common.deleteName', { name: category.name })}
      confirmLabel={t('common.delete')}
      busy={busy}
      onCancel={onClose}
      onConfirm={() =>
        run(() => deleteCategory({ data: { id: category.id } }), {
          onResult: onClose,
        })
      }
    />
  )
}

/**
 * Add a sub-category (in the tree only, through `onAddChild`), archive or reactivate
 * (CAT-03) and delete, as icons on the category's row or its sheet. Delete stays muted
 * while the category has sub-categories.
 */
export function CategoryActions({
  category,
  parent,
  hasChildren,
  branch,
  archivedParents,
  onAddChild,
  placement,
  className,
}: {
  category: Category
  parent: Category | undefined
  hasChildren: boolean
  /** Active sub-categories that archiving takes along. */
  branch: number
  archivedParents: ReadonlyArray<Category>
  onAddChild?: () => void
  placement?: ActionPlacement
  className?: string
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [dialog, setDialog] = useState<StatusMode | 'delete' | null>(null)
  const { name } = category
  const archived = isArchived(category)
  const close = () => setDialog(null)

  return (
    <IconActions
      slots={onAddChild ? 3 : 2}
      placement={placement}
      className={className}
    >
      {onAddChild && (
        <IconLink
          icon="plus"
          label={t('categories.addChildName', { name })}
          to="/settings/categories/new"
          search={{ kind: category.kind, parent: category.id }}
          onClick={onAddChild}
        />
      )}
      <IconButton
        icon={archived ? 'undo' : 'archive'}
        label={t(`common.${archived ? 'reactivate' : 'archive'}Name`, { name })}
        onClick={() => setDialog(archived ? 'reactivate' : 'archive')}
      />
      <IconButton
        icon="trash-full"
        label={
          hasChildren
            ? t('categories.hasChildren')
            : t('common.deleteName', { name })
        }
        muted={hasChildren}
        onClick={() =>
          hasChildren
            ? toast({ text: t('categories.hasChildren') })
            : setDialog('delete')
        }
      />
      {dialog === 'delete' && (
        <DeleteDialog category={category} onClose={close} />
      )}
      {dialog && dialog !== 'delete' && (
        <StatusDialog
          {...{ category, parent, branch, archivedParents }}
          mode={dialog}
          onClose={close}
        />
      )}
    </IconActions>
  )
}

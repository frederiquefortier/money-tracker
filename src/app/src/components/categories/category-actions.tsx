import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { FormField } from '#/components/form-field'
import { IconActions, IconButton, IconLink } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { useServerAction } from '#/components/use-server-action'
import { isArchived } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import { formatDate, todayIso } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import {
  addCategoryPause,
  archiveCategory,
  deleteCategory,
  reactivateCategory,
  setCategoryFavourite,
} from '#/server/categories'

/** The star flips at once and stays until refreshed data includes it (as on Devises). */
function useFavourite(category: Category) {
  const { run } = useServerAction()
  const [change, setChange] = useState<{ on: boolean; from: boolean } | null>(
    null,
  )
  const shown =
    change && change.from === category.isFavourite
      ? change.on
      : category.isFavourite
  function toggle() {
    const on = !shown
    setChange({ on, from: category.isFavourite })
    run(() => setCategoryFavourite({ data: { id: category.id, on } }), {
      onResult: (ok) => !ok && setChange(null),
    })
  }
  return { shown, toggle }
}

type StatusMode = 'archive' | 'reactivate'

function submitStatus(
  mode: StatusMode,
  { id, from, until }: { id: string; from: string; until: string },
) {
  if (mode === 'reactivate') return reactivateCategory({ data: { id, from } })
  if (until) return addCategoryPause({ data: { id, from, until } })
  return archiveCategory({ data: { id, from } })
}

/**
 * Archive or reactivate from a date (CAT-03); archiving takes the branch along. A
 * reactivation date makes it a past period.
 */
function StatusDialog({
  category,
  parent,
  branch,
  mode,
  onClose,
}: {
  category: Category
  parent: Category | undefined
  branch: number
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
  const last = category.history[0]?.effectiveOn
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
      {mode !== 'reactivate' && branch > 0 && (
        <p className="text-sm">
          {t('categories.archiveBranch', { count: branch })}
        </p>
      )}
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
 * Add a sub-category (in the tree only, through `onAddChild`), favourite (CAT-06), archive
 * or reactivate (CAT-03) and delete, as icons on the category's row. Delete stays muted
 * while the category has sub-categories.
 */
export function CategoryActions({
  category,
  parent,
  hasChildren,
  branch,
  onAddChild,
  className,
}: {
  category: Category
  parent: Category | undefined
  hasChildren: boolean
  /** Active sub-categories that archiving takes along. */
  branch: number
  onAddChild?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const favourite = useFavourite(category)
  const [dialog, setDialog] = useState<StatusMode | 'delete' | null>(null)
  const { name } = category
  const archived = isArchived(category)
  const close = () => setDialog(null)

  return (
    <IconActions slots={onAddChild ? 4 : 3} className={className}>
      {onAddChild && (
        <IconLink
          icon="plus"
          label={t('categories.addChildName', { name })}
          to="/settings/categories/new"
          search={{ kind: category.kind, parent: category.id }}
          onClick={onAddChild}
        />
      )}
      {!archived && (
        <IconButton
          icon={favourite.shown ? 'star-fill' : 'star'}
          label={t('categories.favouriteName', { name })}
          pressed={favourite.shown}
          onClick={favourite.toggle}
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
          {...{ category, parent, branch, mode: dialog, onClose: close }}
        />
      )}
    </IconActions>
  )
}

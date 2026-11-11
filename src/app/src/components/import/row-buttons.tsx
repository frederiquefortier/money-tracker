import { useTranslation } from 'react-i18next'
import { IconActions, IconButton } from '#/components/display/icon-button'
import type { SectionItem } from '#/lib/import/import-sections'

export type Actions = {
  onMerge?: () => void
  onEdit?: () => void
  onRemove?: () => void
  /** Puts back what was merged or edited. */
  onRestore?: () => void
  /** Says the merchant is a person. */
  onPerson?: () => void
  /** A name this one looks like, and the merge into it. */
  similar?: { name: string; onMerge: () => void } | null | undefined
  /** A new category shows the icon and colour it will get. */
  badge?: boolean
  /** The merge is a rename: its target is no name that exists. */
  renamed?: boolean
}

export function RowButtons({
  item,
  actions,
  changed,
}: {
  item: SectionItem
  actions: Actions
  changed: boolean
}) {
  const { t } = useTranslation()
  const buttons: Array<React.ReactNode> = []
  if (changed && actions.onRestore) {
    buttons.push(
      <IconButton
        key="restore"
        icon="undo"
        label={t('common.createText', { text: item.label })}
        onClick={actions.onRestore}
      />,
    )
  } else if (!changed) {
    if (actions.onMerge) {
      buttons.push(
        <IconButton
          key="merge"
          icon="merge"
          label={t('import.merge', { name: item.label })}
          onClick={actions.onMerge}
        />,
      )
    }
    if (actions.onEdit) {
      buttons.push(
        <IconButton
          key="edit"
          icon="pencil"
          label={t('common.editName', { name: item.label })}
          onClick={actions.onEdit}
        />,
      )
    }
    if (actions.onPerson) {
      buttons.push(
        <IconButton
          key="person"
          icon="user"
          label={t('import.asPerson', { name: item.label })}
          onClick={actions.onPerson}
        />,
      )
    }
    if (actions.onRemove) {
      buttons.push(
        <IconButton
          key="remove"
          icon="trash-full"
          label={t('common.removeName', { name: item.label })}
          onClick={actions.onRemove}
        />,
      )
    }
  }
  if (!actions.onMerge && !actions.onRestore) return null
  return (
    <IconActions slots={actions.onPerson ? 4 : 3} placement="always">
      {buttons}
    </IconActions>
  )
}

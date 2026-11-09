import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { FormField } from '#/components/forms/form-field'
import { useServerAction } from '#/hooks/app/use-server-action'
import type { ServerActionOptions } from '#/hooks/app/use-server-action'
import { todayIso } from '#/lib/shared/format'
import type { Result } from '#/lib/shared/result'

/** Archives from a date, today unless changed. Mount it only while open, so it starts on today. */
export function ArchiveDialog({
  title,
  dateLabel,
  failureText,
  onArchive,
  onClose,
}: {
  title: string
  dateLabel: string
  failureText?: ServerActionOptions['failureText']
  onArchive: (date: string) => Promise<Result<string>>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { run, busy } = useServerAction()
  const [date, setDate] = useState(todayIso)
  return (
    <ConfirmDialog
      open
      tone="default"
      title={title}
      confirmLabel={t('common.archive')}
      busy={busy}
      canConfirm={date !== ''}
      onCancel={onClose}
      onConfirm={() =>
        run(() => onArchive(date), { onResult: onClose, failureText })
      }
    >
      <FormField
        name="archivedOn"
        type="date"
        required
        label={dateLabel}
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
    </ConfirmDialog>
  )
}

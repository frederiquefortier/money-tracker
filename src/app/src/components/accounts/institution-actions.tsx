import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { IconButton, IconLink } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { useServerAction } from '#/components/use-server-action'
import { deleteInstitution } from '#/server/accounts'
import type { Institution } from '#/server/accounts'

/**
 * Edit and delete on the institution's card header, after the total; on phones delete is
 * in the institution's sheet (`placement="sheet"`, delete alone). Delete waits until no
 * account, open or closed, uses it (ACC-05).
 */
export function InstitutionActions({
  institution,
  inUse,
  placement = 'row',
}: {
  institution: Institution
  inUse: boolean
  placement?: 'row' | 'sheet'
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { run, busy } = useServerAction()
  const [confirming, setConfirming] = useState(false)
  const { id, name } = institution

  return (
    <div className="flex items-center">
      {placement === 'row' && (
        <IconLink
          icon="pencil"
          label={t('common.editName', { name })}
          to="/settings/accounts/institutions/$institutionId"
          params={{ institutionId: id }}
        />
      )}
      <div className={placement === 'row' ? 'hidden md:flex' : 'flex'}>
        <IconButton
          icon="trash-full"
          label={
            inUse ? t('institutions.inUse') : t('common.deleteName', { name })
          }
          muted={inUse}
          onClick={() =>
            inUse
              ? toast({ text: t('institutions.inUse') })
              : setConfirming(true)
          }
        />
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('common.deleteName', { name })}
        confirmLabel={t('common.delete')}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(() => deleteInstitution({ data: { id } }), {
            onResult: () => setConfirming(false),
          })
        }
      />
    </div>
  )
}

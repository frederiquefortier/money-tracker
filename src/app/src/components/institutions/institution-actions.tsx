import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import {
  IconActions,
  IconAnchor,
  IconButton,
} from '#/components/display/icon-button'
import type { ActionPlacement } from '#/components/display/icon-button'
import { deleteInstitution } from '#/server/institutions'
import { useToast } from '#/hooks/app/use-toast'
import type { InstitutionRow } from '#/lib/institutions/institution'

/**
 * The website (opens in a new tab) and delete, as icons on the institution's row or its
 * sheet. Delete waits until no account (open or closed) and no holding uses it (ACC-05).
 */
export function InstitutionActions({
  institution,
  placement,
}: {
  institution: InstitutionRow
  placement?: ActionPlacement
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const { id, name } = institution
  const inUse = institution.accountCount + institution.holdingCount > 0
  const deleteLabel = t('common.deleteName', { name })

  return (
    <>
      <IconActions slots={2} placement={placement}>
        {institution.websiteUrl ? (
          <IconAnchor
            icon="external-link"
            label={t('institutions.openWebsite', { name })}
            href={institution.websiteUrl}
          />
        ) : (
          <IconButton
            icon="external-link"
            label={t('institutions.noWebsite', { name })}
            muted
            onClick={() =>
              toast({ text: t('institutions.noWebsite', { name }) })
            }
          />
        )}
        <IconButton
          icon="trash-full"
          label={inUse ? t('institutions.inUse') : deleteLabel}
          muted={inUse}
          onClick={() =>
            inUse
              ? toast({ text: t('institutions.inUse') })
              : setConfirming(true)
          }
        />
      </IconActions>
      <DeleteDialog
        open={confirming}
        title={deleteLabel}
        onDelete={() => deleteInstitution({ data: { id } })}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}

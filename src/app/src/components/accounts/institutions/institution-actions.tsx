import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeleteDialog } from '#/components/feedback/delete-dialog'
import {
  IconActions,
  IconAnchor,
  IconButton,
} from '#/components/display/icon-button'
import { deleteInstitution } from '#/server/accounts'
import { useToast } from '#/hooks/app/use-toast'
import type { Institution } from '#/lib/accounts/account'

/**
 * The website (opens in a new tab) and delete on the institution's card header, after the total, from `md` up; on phones it is
 * in the institution's sheet (`placement="sheet"`). The header itself opens the form.
 * Delete waits until no account, open or closed, uses it (ACC-05).
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
  const [confirming, setConfirming] = useState(false)
  const { id, name } = institution
  const deleteLabel = t('common.deleteName', { name })

  return (
    <>
      {/* Two slots, as on account rows, so the total lines up with their balances. */}
      <IconActions slots={2} placement={placement}>
        {institution.websiteUrl ? (
          <IconAnchor
            icon="external-link"
            label={t('accounts.website', { name })}
            href={institution.websiteUrl}
          />
        ) : (
          <IconButton
            icon="external-link"
            label={t('accounts.noWebsite', { name })}
            muted
            onClick={() => toast({ text: t('accounts.noWebsite', { name }) })}
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

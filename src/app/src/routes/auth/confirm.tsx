import { useActionState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { AuthShell } from '#/components/layout/auth-shell'
import { FormAlert } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { EMAIL_LINK_TYPES } from '#/lib/auth/auth-schema'
import { verifyEmailLink } from '#/server/password'

// Invitation and reset email links land here.
export const Route = createFileRoute('/auth/confirm')({
  validateSearch: z.object({
    token_hash: z.string().min(1).max(256).catch(''),
    type: z.enum(EMAIL_LINK_TYPES).catch('invite'),
  }),
  component: Confirm,
})

function Confirm() {
  const { t } = useTranslation()
  const router = useRouter()
  const { token_hash, type } = Route.useSearch()

  const [error, accept, pending] = useActionState(async () => {
    const result = await verifyEmailLink({
      data: { tokenHash: token_hash, type },
    })
    if (!result.ok) return t(`emailLink.${type}.invalid`)
    await router.invalidate()
    await router.navigate({ to: '/set-password' })
    return null
  }, null)

  return (
    <AuthShell
      icon="mail"
      title={t(`emailLink.${type}.title`)}
      description={t(`emailLink.${type}.intro`)}
    >
      {token_hash ? (
        <form action={accept}>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t('emailLink.pending') : t('emailLink.continue')}
          </Button>
        </form>
      ) : null}
      {(error ?? !token_hash) && (
        <FormAlert>{error ?? t(`emailLink.${type}.invalid`)}</FormAlert>
      )}
    </AuthShell>
  )
}

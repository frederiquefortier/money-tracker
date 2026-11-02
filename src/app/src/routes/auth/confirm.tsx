import { useActionState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '#/components/auth-shell'
import { FormAlert } from '#/components/form-field'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { EMAIL_LINK_TYPES, verifyEmailLink } from '#/server/password'

// Landing page for the invitation and reset emails (src/supabase/templates/).
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
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>{t(`emailLink.${type}.title`)}</CardTitle>
          <CardDescription>{t(`emailLink.${type}.intro`)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
        </CardContent>
      </Card>
    </AuthShell>
  )
}

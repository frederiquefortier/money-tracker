import { useActionState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { PASSWORD_MIN_LENGTH, passwordSchema } from '#/lib/password'
import { setPassword } from '#/server/password'

export const Route = createFileRoute('/set-password')({
  beforeLoad: ({ context }) => {
    const { session } = context
    if (!session.user) throw redirect({ to: '/sign-in' })
    // Before MFA exists (a new invitee) aal1 is enough; after, the second factor is required,
    // including after a reset link. The MFA page sends the user back here.
    if (session.hasTotp && session.aal !== 'aal2') {
      throw redirect({ to: '/mfa', search: { next: '/set-password' } })
    }
  },
  component: SetPassword,
})

function SetPassword() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = Route.useRouteContext()

  const [error, submit, pending] = useActionState(
    async (_: string | null, form: FormData) => {
      const password = String(form.get('password') ?? '')
      if (password !== String(form.get('confirm') ?? ''))
        return t('setPassword.mismatch')
      if (!passwordSchema.safeParse(password).success)
        return t('setPassword.rule', { min: PASSWORD_MIN_LENGTH })

      const result = await setPassword({ data: { password } })
      if (!result.ok) {
        return result.error === 'genericError'
          ? t('common.genericError')
          : t(`setPassword.${result.error}`)
      }
      await router.invalidate()
      await router.navigate({ to: session.hasTotp ? '/' : '/mfa' })
      return null
    },
    null,
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('setPassword.title')}</CardTitle>
          <CardDescription>
            {t('setPassword.rule', { min: PASSWORD_MIN_LENGTH })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submit} className="flex flex-col gap-4">
            {/* Lets password managers attach the new password to the right account. */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={session.user?.email ?? ''}
              readOnly
              hidden
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('setPassword.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={72}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">{t('setPassword.confirm')}</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? t('setPassword.pending') : t('setPassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

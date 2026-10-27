import { useActionState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LocaleSwitcher } from '#/components/locale-switcher'
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
import { requestPasswordReset } from '#/server/password'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    if (context.session.user) throw redirect({ to: '/' })
  },
  component: ForgotPassword,
})

function ForgotPassword() {
  const { t } = useTranslation()

  const [sent, submit, pending] = useActionState(
    async (_: boolean, form: FormData) => {
      await requestPasswordReset({
        data: { email: String(form.get('email') ?? '') },
      })
      return true
    },
    false,
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('forgotPassword.title')}</CardTitle>
          <CardDescription>{t('forgotPassword.intro')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sent ? (
            // The same message whether or not the address has an account.
            <p role="status" className="text-sm">
              {t('forgotPassword.sent')}
            </p>
          ) : (
            <form action={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t('signIn.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending
                  ? t('forgotPassword.pending')
                  : t('forgotPassword.submit')}
              </Button>
            </form>
          )}
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            {t('forgotPassword.back')}
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

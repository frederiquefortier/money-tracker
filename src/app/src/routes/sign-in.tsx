import { useActionState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
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
import { signIn } from '#/server/session'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: ({ context }) => {
    if (context.session.user)
      throw redirect({ to: context.session.aal === 'aal2' ? '/' : '/mfa' })
  },
  component: SignIn,
})

function SignIn() {
  const { t } = useTranslation()
  const router = useRouter()

  const [error, submit, pending] = useActionState(
    async (_: string | null, form: FormData) => {
      const result = await signIn({
        data: {
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        },
      })
      if (!result.ok) return t('signIn.invalidCredentials')
      await router.invalidate()
      await router.navigate({ to: '/mfa' })
      return null
    },
    null,
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('signIn.title')}</CardTitle>
          <CardDescription>{t('signIn.inviteOnly')}</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('signIn.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? t('signIn.pending') : t('signIn.submit')}
            </Button>
          </form>
          <Link
            to="/forgot-password"
            className="mt-4 block text-sm text-muted-foreground underline underline-offset-4"
          >
            {t('signIn.forgot')}
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

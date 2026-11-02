import { useActionState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '#/components/auth-shell'
import { FormField } from '#/components/form-field'
import { Icon } from '#/components/icon'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formValues, useFieldValidation, validate } from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import { forgotPasswordSchema } from '#/lib/schemas'
import { requestPasswordReset } from '#/server/password'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    if (context.session.user) throw redirect({ to: '/' })
  },
  component: ForgotPassword,
})

type State = { email: string; errors: FieldErrors; sent: boolean }
const initial: State = { email: '', errors: {}, sent: false }

function ForgotPassword() {
  const { t } = useTranslation()

  const [state, submit, pending] = useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const values = formValues(form, ['email'])
      const { data, errors } = validate(forgotPasswordSchema, values)
      if (!data) return { email: values.email, errors, sent: false }
      await requestPasswordReset({ data })
      return { email: values.email, errors: {}, sent: true }
    },
    initial,
  )
  const fields = useFieldValidation(forgotPasswordSchema, state.errors)

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>{t('forgotPassword.title')}</CardTitle>
          <CardDescription>{t('forgotPassword.intro')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state.sent ? (
            // The same message whether or not the address has an account.
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground"
            >
              <Icon name="circle-check" className="mt-0.5 size-4" />
              {t('forgotPassword.sent')}
            </p>
          ) : (
            <form action={submit} noValidate className="flex flex-col gap-4">
              <FormField
                name="email"
                type="email"
                autoComplete="username"
                required
                label={t('signIn.email')}
                defaultValue={state.email}
                error={fields.error('email')}
                onBlur={fields.onBlur}
                onChange={fields.onChange}
              />
              <Button type="submit" disabled={pending}>
                {pending
                  ? t('forgotPassword.pending')
                  : t('forgotPassword.submit')}
              </Button>
            </form>
          )}
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <Icon name="arrow-left" className="size-4" />
            {t('forgotPassword.back')}
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

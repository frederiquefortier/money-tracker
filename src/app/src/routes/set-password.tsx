import { useActionState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '#/components/auth-shell'
import { FormAlert, FormField } from '#/components/form-field'
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
import { PASSWORD_MIN_LENGTH, newPasswordSchema } from '#/lib/schemas'
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

type ServerError = 'weakPassword' | 'samePassword' | 'genericError'
type State = { errors: FieldErrors; serverError: ServerError | null }
const initial: State = { errors: {}, serverError: null }

function SetPassword() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = Route.useRouteContext()

  const [state, submit, pending] = useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const { data, errors } = validate(
        newPasswordSchema,
        formValues(form, ['password', 'confirm']),
      )
      if (!data) return { errors, serverError: null }

      const result = await setPassword({ data: { password: data.password } })
      if (!result.ok) return { errors: {}, serverError: result.error }
      await router.invalidate()
      await router.navigate({ to: session.hasTotp ? '/' : '/mfa' })
      return initial
    },
    initial,
  )
  const fields = useFieldValidation(newPasswordSchema, state.errors)

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>{t('setPassword.title')}</CardTitle>
          <CardDescription>
            {t('setPassword.rule', { min: PASSWORD_MIN_LENGTH })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submit} noValidate className="flex flex-col gap-4">
            {/* Lets password managers attach the new password to the right account. */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={session.user?.email ?? ''}
              readOnly
              hidden
            />
            <FormField
              name="password"
              type="password"
              autoComplete="new-password"
              required
              label={t('setPassword.password')}
              error={fields.error('password')}
              onBlur={fields.onBlur}
              onChange={fields.onChange}
            />
            <FormField
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              label={t('setPassword.confirm')}
              error={fields.error('confirm')}
              onBlur={fields.onBlur}
              onChange={fields.onChange}
            />
            {state.serverError && (
              <FormAlert>
                {state.serverError === 'genericError'
                  ? t('common.genericError')
                  : t(`setPassword.${state.serverError}`)}
              </FormAlert>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? t('setPassword.pending') : t('setPassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

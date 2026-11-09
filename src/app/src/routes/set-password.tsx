import { useActionState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '#/components/layout/auth-shell'
import { FormAlert, FormField } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { formValues, validate } from '#/lib/forms/form-state'
import type { FieldErrors } from '#/lib/forms/form-state'
import { setPassword } from '#/server/password'
import {
  useFieldValidation,
  useFocusFirstError,
} from '#/hooks/forms/use-validation'
import { newPasswordSchema } from '#/lib/auth/auth-schema'

export const Route = createFileRoute('/set-password')({
  beforeLoad: ({ context }) => {
    const { session } = context
    if (!session.user) throw redirect({ to: '/sign-in' })
    // aal1 is enough until a factor exists (new invitee), then aal2.
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
  const formRef = useFocusFirstError(state.errors)

  return (
    <AuthShell icon="lock" title={t('setPassword.title')}>
      <form
        ref={formRef}
        action={submit}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* For password managers. */}
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
          {pending ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </AuthShell>
  )
}

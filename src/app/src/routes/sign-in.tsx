import { useActionState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthShell } from '#/components/layout/auth-shell'
import { FormAlert, FormField } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { formValues, validate } from '#/lib/forms/form-state'
import type { FieldErrors } from '#/lib/forms/form-state'
import { signIn } from '#/server/session'
import {
  useFieldValidation,
  useFocusFirstError,
} from '#/hooks/forms/use-validation'
import { signInSchema } from '#/lib/auth/auth-schema'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: ({ context }) => {
    if (context.session.user)
      throw redirect({ to: context.session.aal === 'aal2' ? '/' : '/mfa' })
  },
  component: SignIn,
})

// The email survives React's form reset; the password does not.
type Failure = 'invalidCredentials' | 'tooManyAttempts' | 'genericError'
type State = { email: string; errors: FieldErrors; failure: Failure | null }
const initial: State = { email: '', errors: {}, failure: null }

function SignIn() {
  const { t } = useTranslation()
  const router = useRouter()

  const [state, submit, pending] = useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const values = formValues(form, ['email', 'password'])
      const { data, errors } = validate(signInSchema, values)
      if (!data) return { email: values.email, errors, failure: null }

      const result = await signIn({ data })
      if (!result.ok)
        return { email: values.email, errors: {}, failure: result.error }
      await router.invalidate()
      await router.navigate({ to: '/mfa' })
      return initial
    },
    initial,
  )
  const fields = useFieldValidation(signInSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <AuthShell icon="log-in" title={t('signIn.title')}>
      <form
        ref={formRef}
        action={submit}
        noValidate
        className="flex flex-col gap-4"
      >
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
        <FormField
          name="password"
          type="password"
          autoComplete="current-password"
          required
          label={t('signIn.password')}
          error={fields.error('password')}
          onBlur={fields.onBlur}
          onChange={fields.onChange}
        />
        {state.failure && (
          <FormAlert>
            {state.failure === 'genericError'
              ? t('common.genericError')
              : t(`signIn.${state.failure}`)}
          </FormAlert>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t('signIn.pending') : t('signIn.submit')}
        </Button>
      </form>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground hover:text-primary"
      >
        <Link to="/forgot-password">{t('signIn.forgot')}</Link>
      </Button>
    </AuthShell>
  )
}

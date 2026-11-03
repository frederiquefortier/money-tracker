import { useActionState, useState, useTransition } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { AuthShell } from '#/components/auth-shell'
import { FormAlert, FormField } from '#/components/form-field'
import { Button } from '#/components/ui/button'
import {
  formValues,
  useFieldValidation,
  useFocusFirstError,
  validate,
} from '#/lib/form'
import type { FieldErrors } from '#/lib/form'
import { totpFormSchema } from '#/lib/schemas'
import { startTotpEnrollment, verifyTotp } from '#/server/session'

// An allowlist: `next` cannot become an open redirect.
const NEXT = ['/', '/set-password'] as const

export const Route = createFileRoute('/mfa')({
  validateSearch: z.object({ next: z.enum(NEXT).optional().catch(undefined) }),
  beforeLoad: ({ context, search }) => {
    if (!context.session.user) throw redirect({ to: '/sign-in' })
    if (context.session.aal === 'aal2')
      throw redirect({ to: search.next ?? '/' })
  },
  component: Mfa,
})

type Enrollment = { factorId: string; qrCode: string; secret: string }
type State = { errors: FieldErrors; rejected: boolean }
const initial: State = { errors: {}, rejected: false }

function Mfa() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const { next } = Route.useSearch()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [startError, setStartError] = useState(false)
  // A second click would replace the factor being enrolled.
  const [starting, startTransition] = useTransition()
  const enrolling = !session.hasTotp

  function start() {
    startTransition(async () => {
      const result = await startTotpEnrollment()
      setStartError(!result.ok)
      if (result.ok) setEnrollment(result)
    })
  }

  const [state, verify, pending] = useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const { data, errors } = validate(
        totpFormSchema,
        formValues(form, ['code']),
      )
      if (!data) return { errors, rejected: false }

      const result = await verifyTotp({
        data: { factorId: enrollment?.factorId, code: data.code },
      })
      if (!result.ok) return { errors: {}, rejected: true }
      await router.invalidate()
      await router.navigate({ to: next ?? '/' })
      return initial
    },
    initial,
  )
  const fields = useFieldValidation(totpFormSchema, state.errors)
  const formRef = useFocusFirstError(state.errors)

  return (
    <AuthShell
      icon="shield-check"
      title={enrolling ? t('mfa.enrollTitle') : t('mfa.challengeTitle')}
      description={enrolling ? t('mfa.enrollIntro') : t('mfa.challengeIntro')}
    >
      {enrolling && !enrollment && (
        <>
          <Button onClick={start} disabled={starting}>
            {t('mfa.start')}
          </Button>
          {startError && <FormAlert>{t('common.genericError')}</FormAlert>}
        </>
      )}

      {enrollment && <EnrollmentKey enrollment={enrollment} />}

      {(!enrolling || enrollment) && (
        <form
          ref={formRef}
          action={verify}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            label={t('mfa.code')}
            className="text-center font-mono text-lg tracking-[0.4em]"
            error={fields.error('code')}
            onBlur={fields.onBlur}
            onChange={fields.onChange}
          />
          {state.rejected && <FormAlert>{t('mfa.invalidCode')}</FormAlert>}
          <Button type="submit" disabled={pending}>
            {pending ? t('mfa.pending') : t('mfa.verify')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

function EnrollmentKey({ enrollment }: { enrollment: Enrollment }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={enrollment.qrCode}
        alt={t('mfa.qrAlt')}
        className="size-48 rounded-xl bg-white p-2 ring-1 ring-border"
      />
      <p className="text-sm text-muted-foreground">{t('mfa.secretLabel')}</p>
      <code className="rounded-lg bg-muted px-2 py-1 font-mono text-sm break-all">
        {enrollment.secret}
      </code>
    </div>
  )
}

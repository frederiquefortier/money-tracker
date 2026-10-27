import { useActionState, useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
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
import { startTotpEnrollment, verifyTotp } from '#/server/session'

// Where to go once verified. An allowlist, so the parameter cannot become an open redirect.
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

function Mfa() {
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const { next } = Route.useSearch()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [startError, setStartError] = useState(false)
  const enrolling = !session.hasTotp

  async function start() {
    const result = await startTotpEnrollment()
    setStartError(!result.ok)
    if (result.ok) setEnrollment(result)
  }

  const [error, verify, pending] = useActionState(
    async (_: string | null, form: FormData) => {
      const result = await verifyTotp({
        data: {
          factorId: enrollment?.factorId,
          code: String(form.get('code') ?? '').trim(),
        },
      })
      if (!result.ok) return t('mfa.invalidCode')
      await router.invalidate()
      await router.navigate({ to: next ?? '/' })
      return null
    },
    null,
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {enrolling ? t('mfa.enrollTitle') : t('mfa.challengeTitle')}
          </CardTitle>
          <CardDescription>
            {enrolling ? t('mfa.enrollIntro') : t('mfa.challengeIntro')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {enrolling && !enrollment && (
            <>
              <Button onClick={() => void start()}>{t('mfa.start')}</Button>
              {startError && (
                <p role="alert" className="text-sm text-destructive">
                  {t('common.genericError')}
                </p>
              )}
            </>
          )}

          {enrollment && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={enrollment.qrCode}
                alt={t('mfa.qrAlt')}
                className="size-48 bg-white p-2"
              />
              <p className="text-sm text-muted-foreground">
                {t('mfa.secretLabel')}
              </p>
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm break-all">
                {enrollment.secret}
              </code>
            </div>
          )}

          {(!enrolling || enrollment) && (
            <form action={verify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">{t('mfa.code')}</Label>
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? t('mfa.pending') : t('mfa.verify')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

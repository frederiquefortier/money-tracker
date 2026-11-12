import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/hooks/app/use-toast'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetClose, SheetFooter } from '#/components/ui/sheet'
import { Spinner } from '#/components/feedback/spinner'

/**
 * The form of a RouteSheet: fields in the scrolling body, Annuler and the submit button
 * in the footer. `error` is a toast when a save ends, so it is seen without scrolling;
 * validation stays under each field.
 */
export function SheetForm({
  action,
  formRef,
  pending,
  canSubmit = true,
  submitLabel,
  error,
  children,
}: {
  action: (form: FormData) => void
  formRef?: React.Ref<HTMLFormElement>
  pending: boolean
  canSubmit?: boolean
  submitLabel?: string
  error?: string | false | null
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const wasPending = useRef(false)
  useEffect(() => {
    if (wasPending.current && !pending && error)
      toast({ text: error, tone: 'error' })
    wasPending.current = pending
  }, [pending, error, toast])
  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <SheetBody className="flex flex-col gap-5">{children}</SheetBody>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="ghost">
            {t('common.cancel')}
          </Button>
        </SheetClose>
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending && <Spinner />}
          {submitLabel ?? t('common.save')}
        </Button>
      </SheetFooter>
    </form>
  )
}

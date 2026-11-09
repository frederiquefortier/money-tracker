import { useTranslation } from 'react-i18next'
import { FormAlert } from '#/components/forms/form-field'
import { Button } from '#/components/ui/button'
import { SheetBody, SheetClose, SheetFooter } from '#/components/ui/sheet'

/**
 * The form of a RouteSheet: fields in the scrolling body, Annuler and the submit button
 * in the footer. `error` shows above the footer; validation stays under each field.
 */
export function SheetForm({
  action,
  formRef,
  pending,
  canSubmit = true,
  submitLabel,
  pendingLabel,
  error,
  children,
}: {
  action: (form: FormData) => void
  formRef?: React.Ref<HTMLFormElement>
  pending: boolean
  canSubmit?: boolean
  submitLabel?: string
  pendingLabel?: string
  error?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <SheetBody className="flex flex-col gap-5">
        {children}
        {error && <FormAlert>{error}</FormAlert>}
      </SheetBody>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="ghost">
            {t('common.cancel')}
          </Button>
        </SheetClose>
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending
            ? (pendingLabel ?? t('common.saving'))
            : (submitLabel ?? t('common.save'))}
        </Button>
      </SheetFooter>
    </form>
  )
}

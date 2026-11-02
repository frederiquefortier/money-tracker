import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, 'id'> & {
  name: string
  label: string
  error?: string
  description?: string
}

/**
 * Label, input and its message, wired for screen readers (aria-invalid, aria-describedby).
 * A password field gets a show/hide button.
 */
export function FormField({
  name,
  label,
  error,
  description,
  type,
  className,
  ...input
}: FormFieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? description
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(isPassword && 'pr-10', className)}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            aria-controls={id}
            aria-label={
              revealed ? t('common.hidePassword') : t('common.showPassword')
            }
            title={
              revealed ? t('common.hidePassword') : t('common.showPassword')
            }
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} className="size-4" />
          </button>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn(
            'flex items-start gap-1.5 text-sm',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {error && <Icon name="circle-warning" className="mt-0.5 size-4" />}
          {message}
        </p>
      )}
    </div>
  )
}

/** A message about the whole form (wrong credentials, expired link). */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <Icon name="circle-warning" className="mt-0.5 size-4" />
      {children}
    </p>
  )
}

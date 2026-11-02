import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn, focusRing } from '#/lib/utils'

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, 'id'> & {
  name: string
  label: string
  error?: string
  description?: string
}

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
  const toggleLabel = revealed
    ? t('common.hidePassword')
    : t('common.showPassword')

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
            aria-label={toggleLabel}
            title={toggleLabel}
            className={cn(
              'absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground hover:text-primary',
              focusRing,
            )}
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

export function FormAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success'
  children: React.ReactNode
}) {
  const error = tone === 'error'
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
        error
          ? 'bg-destructive/10 text-destructive'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      <Icon
        name={error ? 'circle-warning' : 'circle-check'}
        className="mt-0.5 size-4"
      />
      {children}
    </p>
  )
}

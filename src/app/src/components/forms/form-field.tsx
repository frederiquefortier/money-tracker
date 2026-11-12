import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { Input } from '#/components/ui/input'
import { FieldLabel } from '#/components/ui/field'
import { cn } from '#/lib/utils'
import {
  errorTint,
  focusRing,
  successTint,
  warningTint,
} from '#/components/styles'

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
  required,
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
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={isPassword && revealed ? 'text' : type}
          required={required}
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
              'absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-field text-muted-foreground hover:text-primary',
              focusRing,
            )}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} className="size-4" />
          </button>
        )}
      </div>
      {message && (
        <FieldMessage id={messageId} error={Boolean(error)}>
          {message}
        </FieldMessage>
      )}
    </div>
  )
}

/** The line under a field: a validation error, or a description. */
export function FieldMessage({
  id,
  error = true,
  children,
}: {
  id?: string
  error?: boolean
  children: React.ReactNode
}) {
  return (
    <p
      id={id}
      className={cn(
        'flex items-start gap-1.5 text-sm',
        error ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {error && <Icon name="circle-warning" className="mt-0.5 size-4" />}
      {children}
    </p>
  )
}

export const ALERT_TONES = {
  error: { surface: errorTint, icon: 'circle-warning' },
  warning: { surface: warningTint, icon: 'circle-warning' },
  success: {
    surface: successTint,
    icon: 'circle-check',
  },
} as const

export function FormAlert({
  tone = 'error',
  size = 'default',
  className,
  children,
}: {
  tone?: 'error' | 'success' | 'warning'
  /** `tag`: one line, pill-shaped, to sit beside a title. */
  size?: 'default' | 'tag'
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-2',
        size === 'tag'
          ? 'items-center rounded-full px-2 py-0.5 text-xs font-semibold'
          : 'items-start rounded-lg px-3 py-2 text-sm',
        ALERT_TONES[tone].surface,
        className,
      )}
    >
      <Icon
        name={ALERT_TONES[tone].icon}
        className={size === 'tag' ? 'size-3.5' : 'mt-0.5 size-4'}
      />
      {children}
    </p>
  )
}

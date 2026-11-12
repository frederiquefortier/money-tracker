import { useCallback, useState } from 'react'
import { Toast } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { ALERT_TONES } from '#/components/forms/form-field'
import { ToastContext } from '#/hooks/app/use-toast'
import type { ToastOptions } from '#/hooks/app/use-toast'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

type Shown = ToastOptions & { id: number }

let nextId = 0

/** One toast at a time: a new one replaces the last. */
export function Toaster({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [toast, setToast] = useState<Shown | null>(null)
  const show = useCallback(
    (options: ToastOptions) => setToast({ ...options, id: nextId++ }),
    [],
  )

  return (
    <ToastContext value={show}>
      <Toast.Provider swipeDirection="up" duration={5000}>
        {children}
        {toast && (
          <Toast.Root
            key={toast.id}
            onOpenChange={(open) => {
              if (!open) setToast(null)
            }}
            className="rounded-lg bg-card shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2"
          >
            <ToastBody toast={toast} closeLabel={t('common.close')} />
          </Toast.Root>
        )}
        <Toast.Viewport className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-[60] flex flex-col outline-none md:inset-x-auto md:right-6 md:w-96" />
      </Toast.Provider>
    </ToastContext>
  )
}

function ToastBody({
  toast,
  closeLabel,
}: {
  toast: ToastOptions
  closeLabel: string
}) {
  const tone = toast.tone ?? 'neutral'
  const alert = tone === 'neutral' ? null : ALERT_TONES[tone]
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
        alert ? alert.surface : 'bg-foreground text-background',
      )}
    >
      {alert && <Icon name={alert.icon} className="mt-0.5 size-4" />}
      <Toast.Description className="flex-1">{toast.text}</Toast.Description>
      <Toast.Close className={cn('rounded-full p-0.5', focusRing)}>
        <Icon name="close" label={closeLabel} className="size-4" />
      </Toast.Close>
    </div>
  )
}

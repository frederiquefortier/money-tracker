import { createContext, useCallback, useContext, useState } from 'react'
import { Toast } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

type ToastOptions = {
  text: string
  action?: { label: string; altText: string; onClick: () => void }
}
type Shown = ToastOptions & { id: number }

const ToastContext = createContext<(toast: ToastOptions) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

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
      <Toast.Provider swipeDirection="down" duration={5000}>
        {children}
        {toast && (
          <Toast.Root
            key={toast.id}
            onOpenChange={(open) => {
              if (!open) setToast(null)
            }}
            className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
          >
            <Toast.Description className="flex-1">
              {toast.text}
            </Toast.Description>
            {toast.action && (
              <Toast.Action
                altText={toast.action.altText}
                onClick={toast.action.onClick}
                className={cn(
                  'rounded-full px-2 py-1 font-semibold',
                  focusRing,
                )}
              >
                {toast.action.label}
              </Toast.Action>
            )}
            <Toast.Close className={cn('rounded-full p-0.5', focusRing)}>
              <Icon name="close" label={t('common.close')} className="size-4" />
            </Toast.Close>
          </Toast.Root>
        )}
        <Toast.Viewport className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md flex-col outline-none md:bottom-6" />
      </Toast.Provider>
    </ToastContext>
  )
}

import { createContext, useContext, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent } from '#/components/ui/sheet'

const CloseSheet = createContext<() => void>(() => {})

/** Closes the enclosing RouteSheet with its animation, then leaves the route. */
export function useCloseSheet() {
  return useContext(CloseSheet)
}

/**
 * A sheet that is a route (spec 11): it has a URL, so back and reload work. Closing plays
 * the animation first, then navigates to `to` and refreshes its data.
 */
export function RouteSheet({
  title,
  to,
  children,
}: {
  title: string
  to: LinkProps['to']
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <CloseSheet value={() => setOpen(false)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={title}
          closeLabel={t('common.close')}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            // Back on the list, refresh it: the sheet may have changed what it shows.
            void router.navigate({ to }).then(() => router.invalidate())
          }}
        >
          {children}
        </SheetContent>
      </Sheet>
    </CloseSheet>
  )
}

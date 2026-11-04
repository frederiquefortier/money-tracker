import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { Sheet, SheetContent } from '#/components/ui/sheet'

const CloseSheet = createContext<() => void>(() => {})
const MarkChanged = createContext<() => void>(() => {})
const EscapeTo = createContext<(handler: (() => void) | null) => void>(() => {})

/** Closes the enclosing RouteSheet with its animation, then leaves the route. */
export function useCloseSheet() {
  return useContext(CloseSheet)
}

/**
 * Tells the enclosing RouteSheet that something changed, for the choices typing does not
 * report (a picker, a tab). Outside a sheet it does nothing.
 */
export function useMarkChanged() {
  return useContext(MarkChanged)
}

/**
 * While mounted, Escape runs `handler` instead of closing the sheet: a layer over the
 * sheet (the category list) goes back one level.
 */
export function useSheetEscape(handler: () => void) {
  const setEscape = useContext(EscapeTo)
  const latest = useRef(handler)
  latest.current = handler
  useEffect(() => {
    setEscape(() => latest.current())
    return () => setEscape(null)
  }, [setEscape])
}

/**
 * A sheet that is a route (spec 11): it has a URL, so back and reload work. Closing plays
 * the animation first, then navigates to `to` and refreshes its data. `actions` show in
 * the header on phones (shared patterns). Once something was typed or chosen, closing
 * other than by saving asks first (spec 15).
 */
export function RouteSheet({
  title,
  to,
  actions,
  children,
}: {
  title: string
  to: LinkProps['to']
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [changed, setChanged] = useState(false)
  const [asking, setAsking] = useState(false)
  const markChanged = () => setChanged(true)
  const escape = useRef<(() => void) | null>(null)
  const [setEscape] = useState(() => (handler: (() => void) | null) => {
    escape.current = handler
  })

  return (
    <CloseSheet value={() => setOpen(false)}>
      <MarkChanged value={markChanged}>
        <EscapeTo value={setEscape}>
          <Sheet
            open={open}
            onOpenChange={(next) => {
              if (!next && changed) setAsking(true)
              else setOpen(next)
            }}
          >
            <SheetContent
              title={title}
              closeLabel={t('common.close')}
              actions={actions}
              onEscapeKeyDown={(event) => {
                if (!escape.current) return
                event.preventDefault()
                escape.current()
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                // Back on the list, refresh it: the sheet may have changed what it shows.
                void router.navigate({ to }).then(() => router.invalidate())
              }}
            >
              <div className="contents" onInputCapture={markChanged}>
                {children}
              </div>
              <ConfirmDialog
                open={asking}
                title={t('common.discardTitle')}
                confirmLabel={t('common.discard')}
                irreversible={false}
                onCancel={() => setAsking(false)}
                onConfirm={() => {
                  setAsking(false)
                  setOpen(false)
                }}
              />
            </SheetContent>
          </Sheet>
        </EscapeTo>
      </MarkChanged>
    </CloseSheet>
  )
}

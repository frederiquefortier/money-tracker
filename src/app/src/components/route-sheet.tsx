import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/confirm-dialog'
import { Sheet, SheetContent } from '#/components/ui/sheet'

const CloseSheet = createContext<() => void>(() => {})
const MarkChanged = createContext<() => void>(() => {})
// Layers over the sheet, innermost last: Escape runs the last one's handler.
const EscapeTo = createContext<(handler: () => void) => () => void>(
  () => () => {},
)

/** Closes the enclosing sheet with its animation (a RouteSheet then leaves its route). */
export function useCloseSheet() {
  return useContext(CloseSheet)
}

/**
 * Tells the enclosing sheet that something changed, for the choices typing does not
 * report (a picker, a tab). Outside a sheet it does nothing.
 */
export function useMarkChanged() {
  return useContext(MarkChanged)
}

/**
 * While mounted, Escape runs `handler` instead of closing the sheet: a layer over the
 * sheet (the category list) goes back one level, a field being typed (a create row)
 * stops. The innermost wins; the one under it is back once it unmounts.
 */
export function useSheetEscape(handler: () => void) {
  const push = useContext(EscapeTo)
  const latest = useRef(handler)
  latest.current = handler
  useEffect(() => push(() => latest.current()), [push])
}

/**
 * A form's sheet: closing plays the animation, then runs `onClosed`. Once something was
 * typed or chosen, closing other than by saving asks first (spec 15). `actions` show in
 * the header on phones (shared patterns). A sheet over a sheet (the category form over a
 * transaction) is one too, with its own changes and Escape layers.
 */
export function FormSheet({
  title,
  actions,
  onClosed,
  children,
}: {
  title: string
  actions?: React.ReactNode
  onClosed: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [changed, setChanged] = useState(false)
  const [asking, setAsking] = useState(false)
  const markChanged = () => setChanged(true)
  const escapes = useRef<Array<() => void>>([])
  const [pushEscape] = useState(() => (handler: () => void) => {
    escapes.current.push(handler)
    return () => {
      escapes.current = escapes.current.filter((h) => h !== handler)
    }
  })

  return (
    <CloseSheet value={() => setOpen(false)}>
      <MarkChanged value={markChanged}>
        <EscapeTo value={pushEscape}>
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
                const handler = escapes.current.at(-1)
                if (!handler) return
                event.preventDefault()
                handler()
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                onClosed()
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

/**
 * A sheet that is a route (spec 11): it has a URL, so back and reload work. Once closed
 * it navigates to `to` and refreshes its data.
 */
export function RouteSheet({
  to,
  ...sheet
}: Omit<React.ComponentProps<typeof FormSheet>, 'onClosed'> & {
  to: LinkProps['to']
}) {
  const router = useRouter()
  return (
    <FormSheet
      {...sheet}
      // Refresh first, while the sheet's route leaves the scroll alone: every load after
      // the navigation would scroll the list back to the top.
      onClosed={() =>
        void router
          .invalidate()
          .then(() => router.navigate({ to, resetScroll: false }))
      }
    />
  )
}

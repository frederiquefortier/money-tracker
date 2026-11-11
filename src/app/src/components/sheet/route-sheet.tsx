import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { CloseSheet, EscapeTo, MarkChanged } from '#/hooks/forms/use-sheet'
import { Sheet, SheetContent } from '#/components/ui/sheet'

/**
 * A form's sheet: closing plays the animation, then runs `onClosed`. Once something was
 * typed or chosen, closing other than by saving asks first. `actions` show in
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
  // Stable: a field that reads it (a Combobox) is not re-rendered by the first keystroke,
  // which would put back the text before its own change is applied.
  const [markChanged] = useState(() => () => setChanged(true))
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
 * A sheet that is a route: it has a URL, so back and reload work. Once closed
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
      // the navigation would scroll the list back to the top. The sheets' own routes are
      // left out: they are about to go, and the form's pickers would load again for nothing.
      onClosed={() =>
        void router
          .invalidate({ filter: (match) => match.staticData.sheet !== true })
          .then(() => router.navigate({ to, resetScroll: false }))
      }
    />
  )
}

import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

type Target = Pick<LinkProps, 'to' | 'search'>

/** `label` is the accessible name and tooltip ("Ajouter un compte"). */
export type AddOption = Target & { label: string; icon: IconName }

// Bottom right, above the tab bar on phones.
const position =
  'fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 md:right-6 md:bottom-6'

const round = cn(
  'grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90',
  focusRing,
)

// How far the options fan out from the button's centre, in px.
const RADIUS = 84

// The angle between two options: their 48px circles side by side with a small gap.
const STEP = 42

/**
 * Where option `i` sits: one after another on a quarter circle, starting at the button's
 * left (180°) and going up, however many there are.
 */
function offset(i: number) {
  const angle = (Math.PI / 180) * (180 - i * STEP)
  return {
    x: Math.round(Math.cos(angle) * RADIUS),
    y: Math.round(-Math.sin(angle) * RADIUS),
  }
}

const Slot = createContext<HTMLElement | null>(null)
const SetSlot = createContext<(slot: HTMLElement | null) => void>(() => {})

/**
 * Each page draws its own +, but it is rendered at `AddButtonTarget`, the start of the
 * page's content, so it is the content's first stop when tabbing.
 * It is fixed in place, so where it sits in the document changes nothing on screen.
 */
export function AddButtonSlot({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  return (
    <Slot value={slot}>
      <SetSlot value={setSlot}>{children}</SetSlot>
    </Slot>
  )
}

export function AddButtonTarget() {
  return <div ref={useContext(SetSlot)} />
}

// In place until the slot exists (the server's render, the first one in the browser).
function InSlot({ children }: { children: React.ReactNode }) {
  const slot = useContext(Slot)
  return slot ? createPortal(children, slot) : children
}

/** The round add button of a screen that adds one thing: straight to its form. */
export function FloatingAddLink({
  label,
  ...target
}: Target & { label: string }) {
  return (
    <InSlot>
      <Link
        {...target}
        aria-label={label}
        title={label}
        className={cn(position, round)}
      >
        <Icon name="plus" className="size-6" />
      </Link>
    </InSlot>
  )
}

function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onEscape])
}

function RadialOption({
  option,
  index,
  open,
  onPick,
}: {
  option: AddOption
  index: number
  open: boolean
  onPick: () => void
}) {
  const { x, y } = offset(index)
  return (
    <li
      className={cn(
        'absolute top-1 left-1 transition-[translate,scale,opacity] duration-200 ease-out motion-reduce:transition-none',
        !open && 'pointer-events-none scale-50 opacity-0',
      )}
      style={{
        translate: open ? `${x}px ${y}px` : '0 0',
        transitionDelay: open ? `${index * 40}ms` : '0ms',
      }}
    >
      <Link
        to={option.to}
        search={option.search}
        aria-label={option.label}
        title={option.label}
        onClick={onPick}
        className={cn(
          'grid size-12 place-items-center rounded-full border bg-card text-primary shadow-lg hover:bg-secondary',
          focusRing,
        )}
      >
        <Icon name={option.icon} />
      </Link>
    </li>
  )
}

/**
 * The round add button of a screen that adds several things: it turns into a ✕ and fans
 * them out one after another on a quarter circle, from its left upwards.
 */
export function FloatingAddButton({
  label,
  options,
}: {
  label: string
  options: ReadonlyArray<AddOption>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const listId = useId()
  useEscape(open, close)

  const toggleLabel = open ? t('common.close') : label
  return (
    <InSlot>
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30"
          onClick={close}
        />
      )}
      <div className={position}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => setOpen(!open)}
          className={round}
        >
          <Icon
            name="plus"
            className={cn(
              'size-6 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-45',
            )}
          />
        </button>
        <ul id={listId} aria-label={label} inert={!open}>
          {options.map((option, i) => (
            <RadialOption
              key={option.label}
              option={option}
              index={i}
              open={open}
              onPick={close}
            />
          ))}
        </ul>
      </div>
    </InSlot>
  )
}

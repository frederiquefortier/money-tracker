import { UNSAFE_PortalProvider } from 'react-aria'
import { Button, Tooltip, TooltipTrigger } from 'react-aria-components'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { cn } from '#/lib/utils'

/**
 * A small (i) beside a label that explains it on hover and on focus, which is also what a
 * tap does on a phone. `label` names the button for screen readers; the tooltip
 * text is its description.
 */
export function InfoTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <TooltipTrigger delay={200} closeDelay={100}>
      <Button
        aria-label={label}
        className={cn(
          'grid size-5 place-items-center rounded-full text-muted-foreground hover:text-foreground',
          focusRing,
        )}
      >
        <Icon name="circle-info" className="size-4" />
      </Button>
      {/* To the page, not to the sheet around it: the icon sits at the sheet's far edge, and
          the tooltip is placed against the screen, ending where the icon ends. */}
      <UNSAFE_PortalProvider getContainer={null}>
        <Tooltip
          placement="top end"
          offset={6}
          containerPadding={16}
          className="z-[70] w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-lg bg-foreground px-3 py-2 text-xs leading-snug font-medium text-background shadow-md"
        >
          {children}
        </Tooltip>
      </UNSAFE_PortalProvider>
    </TooltipTrigger>
  )
}

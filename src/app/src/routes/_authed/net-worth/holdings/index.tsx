import { createFileRoute, redirect } from '@tanstack/react-router'

// The subpage merged into the hub (ADR-061); an old link lands there.
export const Route = createFileRoute('/_authed/net-worth/holdings/')({
  beforeLoad: () => {
    throw redirect({ to: '/net-worth', replace: true })
  },
})

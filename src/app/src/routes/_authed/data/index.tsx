import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/data/')({
  beforeLoad: () => {
    throw redirect({ to: '/data/import', replace: true })
  },
})

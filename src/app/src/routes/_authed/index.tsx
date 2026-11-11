import { createFileRoute, redirect } from '@tanstack/react-router'

// The Transactions tab is the home; its forms open at /transactions/….
export const Route = createFileRoute('/_authed/')({
  beforeLoad: () => {
    throw redirect({ to: '/transactions' })
  },
})

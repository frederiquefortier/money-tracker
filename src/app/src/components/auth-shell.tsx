import { LocaleSwitcher } from '#/components/locale-switcher'
import { Logo } from '#/components/logo'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export function AuthShell({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-10">
        <LocaleSwitcher />
      </div>
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
        <div className="flex justify-center">
          <Logo showName={false} size="lg" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </main>
    </>
  )
}

import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { LocaleSwitcher } from '#/components/locale-switcher'
import { Logo } from '#/components/logo'
import { Sparkle } from '#/components/sparkle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export function AuthShell({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sunset">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Sparkle className="absolute top-[12%] right-[10%] size-16 text-white/90" />
        <Sparkle className="absolute top-[22%] right-[4%] size-7 text-primary" />
        <Sparkle className="absolute bottom-[18%] left-[8%] size-9 text-primary" />
        <Sparkle className="absolute bottom-[8%] left-[18%] size-12 text-white/80" />
      </div>
      <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-10">
        <LocaleSwitcher />
      </div>
      <main className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-16">
        <div className="flex justify-center">
          <Logo showName={false} size="lg" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name={icon} className="text-primary" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </main>
    </div>
  )
}

/** A titled block of the design gallery, reachable from the page's contents by `id`. */
export function GallerySection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-6">
      <h2 className="border-b pb-2 font-mono text-lg font-bold tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** One component or state, named by the file and export it comes from. */
export function Specimen({
  name,
  source,
  children,
}: {
  name: string
  source?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-sm font-bold">{name}</h3>
        {source && (
          <code className="text-xs text-muted-foreground">{source}</code>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

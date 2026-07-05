import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

export function LastUpdatedLabel({ time }: { time: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
      Updated {time}
    </span>
  )
}

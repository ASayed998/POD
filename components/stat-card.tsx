import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  emphasis = false,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border p-4",
        emphasis ? "bg-foreground text-background" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            emphasis ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            className={cn(
              "size-4",
              emphasis ? "text-background/70" : "text-muted-foreground",
            )}
            strokeWidth={2}
          />
        )}
      </div>
      <span className="text-2xl font-semibold tracking-tight tabular">
        {value}
      </span>
      {hint && (
        <span
          className={cn(
            "text-xs",
            emphasis ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

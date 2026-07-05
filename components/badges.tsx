import { cn } from "@/lib/utils"

export type PriorityBand = "P1" | "P2" | "P3" | "P4"

/**
 * Priority is encoded by FILL DARKNESS (P1 darkest -> P4 lightest) AND the
 * literal P# label, so color is never the sole indicator. Pure grayscale.
 */
const bandStyles: Record<PriorityBand, string> = {
  P1: "bg-foreground text-background border-transparent",
  P2: "bg-foreground/70 text-background border-transparent",
  P3: "bg-secondary text-foreground border-border",
  P4: "bg-card text-muted-foreground border-border",
}

export function PriorityBadge({
  band,
  className,
}: {
  band: PriorityBand
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular",
        bandStyles[band],
        className,
      )}
      aria-label={`Priority ${band}`}
    >
      {band}
    </span>
  )
}

export type RequestStatus =
  | "Intake"
  | "Triaged"
  | "In Refinement"
  | "Ready"
  | "In Sprint"
  | "In Progress"
  | "In Review"
  | "Done"
  | "Blocked"
  | "Dropped"

// Filled dot intensity signals lifecycle progression; text label is authoritative.
const statusDot: Record<RequestStatus, string> = {
  Intake: "bg-muted-foreground/40",
  Triaged: "bg-muted-foreground/60",
  "In Refinement": "bg-muted-foreground/70",
  Ready: "bg-muted-foreground",
  "In Sprint": "bg-foreground/80",
  "In Progress": "bg-foreground",
  "In Review": "bg-foreground",
  Done: "bg-foreground",
  Blocked: "bg-foreground",
  Dropped: "bg-muted-foreground/30",
}

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        status === "Dropped" && "text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          statusDot[status],
          status === "Blocked" && "ring-2 ring-foreground/20",
        )}
        aria-hidden
      />
      {status}
    </span>
  )
}

export type Confidence = "H" | "M" | "L"

const confLabel: Record<Confidence, string> = {
  H: "High",
  M: "Medium",
  L: "Low",
}

export function ConfidenceChip({
  level,
  className,
}: {
  level: Confidence
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
      title={`${confLabel[level]} confidence`}
    >
      <span aria-hidden className="font-mono">
        {level}
      </span>
      <span className="sr-only">{confLabel[level]} confidence</span>
      {confLabel[level]}
    </span>
  )
}

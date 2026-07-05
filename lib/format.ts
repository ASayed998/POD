import type { PriorityBand } from "@/components/badges"

export function requestRef(id: number) {
  return `R-${String(id).padStart(3, "0")}`
}

export function ideaRef(id: number) {
  return `I-${String(id).padStart(3, "0")}`
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function relativeTime(d: Date | string | null | undefined) {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function isOverdue(neededBy: Date | string | null, status: string) {
  if (!neededBy) return false
  if (status === "Done" || status === "Dropped") return false
  return new Date(neededBy).getTime() < Date.now()
}

// Scoring engine: 4 factors (1-5), weighted, normalized to 0-100.
export const SCORE_WEIGHTS = {
  factorValue: 0.35,
  factorUrgency: 0.25,
  factorStrategic: 0.25,
  factorReach: 0.15,
} as const

export function computeScore(f: {
  factorValue?: number | null
  factorUrgency?: number | null
  factorStrategic?: number | null
  factorReach?: number | null
}) {
  const v = f.factorValue ?? 0
  const u = f.factorUrgency ?? 0
  const s = f.factorStrategic ?? 0
  const r = f.factorReach ?? 0
  const weighted =
    v * SCORE_WEIGHTS.factorValue +
    u * SCORE_WEIGHTS.factorUrgency +
    s * SCORE_WEIGHTS.factorStrategic +
    r * SCORE_WEIGHTS.factorReach
  // weighted is 0-5 -> scale to 0-100
  return Math.round((weighted / 5) * 100)
}

export function scoreToBand(score: number, riskGate = false): PriorityBand {
  let band: PriorityBand
  if (score >= 80) band = "P1"
  else if (score >= 60) band = "P2"
  else if (score >= 40) band = "P3"
  else band = "P4"
  // Risk gate caps priority at P3 (never P1/P2)
  if (riskGate && (band === "P1" || band === "P2")) return "P3"
  return band
}

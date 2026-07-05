"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SlidersHorizontal, Save, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PriorityBadge,
  StatusBadge,
  type PriorityBand,
  type RequestStatus,
} from "@/components/badges"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast"
import { requestRef, computeScore, scoreToBand, SCORE_WEIGHTS } from "@/lib/format"
import { saveScore } from "@/app/actions/requests"
import type { Request } from "@/lib/db/schema"

const FACTORS = [
  { key: "factorValue", label: "Value", weight: SCORE_WEIGHTS.factorValue, help: "Business / client impact if delivered." },
  { key: "factorUrgency", label: "Urgency", weight: SCORE_WEIGHTS.factorUrgency, help: "Time sensitivity and cost of delay." },
  { key: "factorStrategic", label: "Strategic", weight: SCORE_WEIGHTS.factorStrategic, help: "Fit with roadmap and long-term goals." },
  { key: "factorReach", label: "Reach", weight: SCORE_WEIGHTS.factorReach, help: "How many users / clients are affected." },
] as const

type FactorKey = (typeof FACTORS)[number]["key"]

function ScoreEditor({ request }: { request: Request }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  const [values, setValues] = useState<Record<FactorKey, number>>({
    factorValue: request.factorValue ?? 3,
    factorUrgency: request.factorUrgency ?? 3,
    factorStrategic: request.factorStrategic ?? 3,
    factorReach: request.factorReach ?? 3,
  })
  const [riskGate, setRiskGate] = useState(request.riskGate)

  const score = useMemo(() => computeScore(values), [values])
  const band = useMemo(() => scoreToBand(score, riskGate), [score, riskGate])
  const rawBand = scoreToBand(score, false)
  const capped = riskGate && rawBand !== band

  const handleSave = () => {
    startTransition(async () => {
      await saveScore(request.id, { ...values, riskGate })
      toast(`Scored ${requestRef(request.id)} → ${band} (${score}).`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {requestRef(request.id)}
              </span>
              <StatusBadge status={request.status as RequestStatus} />
            </div>
            <Link
              href={`/requests/${request.id}`}
              className="text-sm font-semibold text-foreground hover:underline text-pretty"
            >
              {request.title}
            </Link>
          </div>
          <div className="flex shrink-0 flex-col items-center rounded-xl border border-border bg-secondary/40 px-3 py-1.5">
            <PriorityBadge band={band} />
            <span className="mt-1 text-lg font-semibold tabular leading-none">
              {score}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {FACTORS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <Label className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ×{Math.round(f.weight * 100)}%
                  </span>
                </Label>
                <span className="text-sm font-semibold tabular text-foreground">
                  {values[f.key]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))
                }
                className="pod-range"
                aria-label={f.label}
              />
              <p className="text-xs text-muted-foreground">{f.help}</p>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
          <input
            type="checkbox"
            checked={riskGate}
            onChange={(e) => setRiskGate(e.target.checked)}
            className="mt-0.5 size-4 accent-foreground"
          />
          <span className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ShieldAlert className="size-3.5" /> Risk / compliance gate
            </span>
            <span className="text-xs text-muted-foreground">
              Caps priority at P3 regardless of score.
            </span>
          </span>
        </label>

        {capped && (
          <p className="text-xs font-medium text-foreground">
            Raw band {rawBand} capped to {band} by the risk gate.
          </p>
        )}

        <Button onClick={handleSave} disabled={pending}>
          <Save className="size-4" />
          {pending ? "Saving…" : "Save score"}
        </Button>
      </CardContent>
    </Card>
  )
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={className}>{children}</span>
}

export function TriagePanel({ queue }: { queue: Request[] }) {
  const unscored = queue.filter((r) => r.priorityScore == null)
  const scored = queue.filter((r) => r.priorityScore != null)

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="Nothing to triage"
        description="New intake requests will show up here for scoring. Capture one from the intake form to get started."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3.5 py-2.5 text-sm text-muted-foreground">
        <SlidersHorizontal className="size-4 shrink-0" />
        <span>
          Score is weighted across four factors (0–100) and maps to a band:{" "}
          <span className="font-medium text-foreground">P1 ≥ 80</span>,{" "}
          <span className="font-medium text-foreground">P2 ≥ 60</span>,{" "}
          <span className="font-medium text-foreground">P3 ≥ 40</span>, else P4.
        </span>
      </div>

      {unscored.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Needs scoring{" "}
            <span className="text-muted-foreground tabular">({unscored.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {unscored.map((r) => (
              <ScoreEditor key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {scored.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Re-score{" "}
            <span className="text-muted-foreground tabular">({scored.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {scored.map((r) => (
              <ScoreEditor key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

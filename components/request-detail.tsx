"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PriorityBadge,
  StatusBadge,
  type PriorityBand,
  type RequestStatus,
} from "@/components/badges"
import { useToast } from "@/components/toast"
import { requestRef, formatDate } from "@/lib/format"
import { advanceStatus, updateRequestFields } from "@/app/actions/requests"
import type { Request } from "@/lib/db/schema"

const STAGE_GATES = ["Not Started", "Draft", "Passed", "Sent Back"]

export function RequestDetail({
  request,
  nextOptions,
}: {
  request: Request
  nextOptions: string[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  const [owner, setOwner] = useState(request.owner ?? "")
  const [neededBy, setNeededBy] = useState(
    request.neededBy ? new Date(request.neededBy).toISOString().slice(0, 10) : "",
  )
  const [description, setDescription] = useState(request.description ?? "")
  const [bucket, setBucket] = useState(request.bucket)
  const [stageGate, setStageGate] = useState(request.stageGate)

  const links: string[] = request.refLinks ? JSON.parse(request.refLinks) : []

  const handleAdvance = (status: string) => {
    startTransition(async () => {
      await advanceStatus(request.id, status)
      toast(`Moved to “${status}”.`)
      router.refresh()
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      await updateRequestFields(request.id, {
        owner,
        neededBy: neededBy || null,
        description,
        bucket,
        stageGate,
      })
      toast("Request updated.")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to tracker
        </Link>
      </div>

      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {requestRef(request.id)}
            </span>
            {request.priorityBand && (
              <PriorityBadge band={request.priorityBand as PriorityBand} />
            )}
            <StatusBadge status={request.status as RequestStatus} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {request.title}
          </h1>
        </div>
        {request.priorityScore != null && (
          <div className="flex shrink-0 flex-col items-end rounded-xl border border-border bg-card px-4 py-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Score
            </span>
            <span className="text-2xl font-semibold tabular">
              {request.priorityScore}
            </span>
          </div>
        )}
      </div>

      {/* Status flow */}
      {nextOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Move this request forward</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {nextOptions.map((s) => (
              <Button
                key={s}
                variant={s === "Dropped" ? "ghost" : "outline"}
                onClick={() => handleAdvance(s)}
                disabled={pending}
              >
                {s === "Dropped" ? null : <ChevronRight className="size-4" />}
                {s}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Add context, the underlying problem, and constraints."
              />
            </CardContent>
          </Card>

          {links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reference links</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 pt-0">
                {links.map((l, i) => (
                  <a
                    key={i}
                    href={l}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
                  >
                    {l}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {(request.factorValue != null || request.priorityScore != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Scoring factors</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-0 sm:grid-cols-4">
                {[
                  ["Value", request.factorValue],
                  ["Reach", request.factorReach],
                  ["Urgency", request.factorUrgency],
                  ["Strategic", request.factorStrategic],
                ].map(([label, val]) => (
                  <div
                    key={label as string}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border py-3"
                  >
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-lg font-semibold tabular">
                      {val != null ? String(val) : "—"}
                    </span>
                  </div>
                ))}
                {request.riskGate && (
                  <p className="col-span-full text-xs font-medium text-foreground">
                    Risk gate applied — priority capped at P3.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meta / editable */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Unassigned"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bucket">Bucket</Label>
              <Select id="bucket" value={bucket} onChange={(e) => setBucket(e.target.value)}>
                <option value="Client">Client</option>
                <option value="Internal">Internal</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stage">Stage gate</Label>
              <Select id="stage" value={stageGate} onChange={(e) => setStageGate(e.target.value)}>
                {STAGE_GATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="needed">Needed by</Label>
              <Input
                id="needed"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            </div>

            <dl className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground">{request.reqType ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="text-foreground">{request.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatDate(request.createdAt)}</dd>
              </div>
            </dl>

            <Button onClick={handleSave} disabled={pending}>
              <Save className="size-4" />
              {pending ? "Saving…" : "Save details"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

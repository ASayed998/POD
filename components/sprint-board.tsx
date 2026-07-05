"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Columns3, Plus, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  PriorityBadge,
  type PriorityBand,
} from "@/components/badges"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast"
import { requestRef } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  commitToSprint,
  updateSprintItem,
} from "@/app/actions/sprint"
import type { Request } from "@/lib/db/schema"

type BoardItem = {
  id: number
  requestId: number
  boardStatus: string
  percentComplete: number
  blocker: string | null
  estDays: number
  bucket: string
  title: string | null
  priorityBand: string | null
  priorityScore: number | null
  owner: string | null
}

type Capacity = {
  total: number
  clientCap: number
  internalCap: number
  clientUsed: number
  internalUsed: number
}

const COLUMNS = ["Committed", "In Progress", "In Review", "Done", "Blocked"] as const

function CapacityBar({
  label,
  used,
  cap,
}: {
  label: string
  used: number
  cap: number
}) {
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0
  const over = used > cap
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("tabular text-xs", over ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {used} / {cap} days{over ? " · over" : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary border border-border">
        <div
          className={cn("h-full rounded-full", over ? "bg-foreground" : "bg-foreground/70")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function SprintBoard({
  sprintName,
  items,
  ready,
  capacity,
}: {
  sprintName: string
  items: BoardItem[]
  ready: Request[]
  capacity: Capacity
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  const [commitFor, setCommitFor] = useState<Request | null>(null)
  const [estDays, setEstDays] = useState(3)
  const [breach, setBreach] = useState<{ projected: number; limit: number } | null>(null)
  const [overrideReason, setOverrideReason] = useState("")

  const openCommit = (r: Request) => {
    setCommitFor(r)
    setEstDays(3)
    setBreach(null)
    setOverrideReason("")
  }

  const doCommit = (override = false) => {
    if (!commitFor) return
    startTransition(async () => {
      const res = await commitToSprint({
        requestId: commitFor.id,
        estDays,
        bucket: commitFor.bucket,
        override,
        overrideReason,
      })
      if (!res.ok && res.breach) {
        setBreach({ projected: res.projected, limit: res.limit })
        return
      }
      toast(
        res.breach
          ? "Committed with a capacity override logged."
          : "Request committed to the sprint.",
      )
      setCommitFor(null)
      router.refresh()
    })
  }

  const moveItem = (id: number, boardStatus: string) => {
    startTransition(async () => {
      await updateSprintItem(id, {
        boardStatus,
        percentComplete: boardStatus === "Done" ? 100 : undefined,
      })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Capacity */}
      <Card>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
          <CapacityBar label="Client capacity" used={capacity.clientUsed} cap={capacity.clientCap} />
          <CapacityBar label="Internal capacity" used={capacity.internalUsed} cap={capacity.internalCap} />
        </CardContent>
      </Card>

      {/* Ready to commit */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Ready to commit{" "}
          <span className="text-muted-foreground tabular">({ready.length})</span>
        </h2>
        {ready.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No requests are in the “Ready” gate. Score and refine requests to make them eligible.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ready.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {requestRef(r.id)}
                    </span>
                    {r.priorityBand && (
                      <PriorityBadge band={r.priorityBand as PriorityBand} />
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {r.title}
                  </p>
                  <span className="text-xs text-muted-foreground">{r.bucket}</span>
                </div>
                <Button size="sm" onClick={() => openCommit(r)} disabled={pending}>
                  <Plus className="size-3.5" /> Commit
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Board */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">{sprintName} board</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={Columns3}
            title="Nothing committed yet"
            description="Pull ready requests into the sprint above. Committed work shows up here as a board you can move across stages."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {COLUMNS.map((col) => {
              const colItems = items.filter((i) => i.boardStatus === col)
              return (
                <div key={col} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {col}
                    </span>
                    <span className="tabular text-xs text-muted-foreground">
                      {colItems.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {colItems.map((item) => {
                      const nextIdx = COLUMNS.indexOf(col as (typeof COLUMNS)[number])
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/requests/${item.requestId}`}
                              className="font-mono text-xs text-muted-foreground hover:text-foreground"
                            >
                              {requestRef(item.requestId)}
                            </Link>
                            {item.priorityBand && (
                              <PriorityBadge band={item.priorityBand as PriorityBand} />
                            )}
                          </div>
                          <p className="text-sm font-medium leading-snug text-foreground text-pretty">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.owner ?? "Unassigned"}</span>
                            <span className="tabular">{item.estDays}d</span>
                          </div>

                          {col === "Blocked" && item.blocker && (
                            <p className="flex items-start gap-1 rounded-md bg-secondary/60 px-2 py-1 text-xs text-foreground">
                              <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                              {item.blocker}
                            </p>
                          )}

                          <Select
                            value={item.boardStatus}
                            onChange={(e) => moveItem(item.id, e.target.value)}
                            disabled={pending}
                            className="h-8 text-xs"
                            aria-label={`Move ${item.title}`}
                          >
                            {COLUMNS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Commit dialog */}
      <Dialog open={!!commitFor} onOpenChange={(o) => !o && setCommitFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit to {sprintName}</DialogTitle>
            <DialogDescription>
              {commitFor ? `${requestRef(commitFor.id)} · ${commitFor.title}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="est">Estimated effort (pod-days)</Label>
              <Input
                id="est"
                type="number"
                min={1}
                max={20}
                value={estDays}
                onChange={(e) => setEstDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Counts against the {commitFor?.bucket.toLowerCase()} capacity budget.
              </p>
            </div>

            {breach && (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/50 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <TriangleAlert className="size-4" /> Over capacity
                </p>
                <p className="text-xs text-muted-foreground">
                  This pushes {commitFor?.bucket.toLowerCase()} to {breach.projected} days,
                  over the {breach.limit}-day budget. Add a reason to override.
                </p>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                  placeholder="Why is this worth exceeding capacity?"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCommitFor(null)}>
              Cancel
            </Button>
            {breach ? (
              <Button
                variant="destructive"
                onClick={() => doCommit(true)}
                disabled={pending || !overrideReason.trim()}
              >
                Override & commit
              </Button>
            ) : (
              <Button onClick={() => doCommit(false)} disabled={pending}>
                Commit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

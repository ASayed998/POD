"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowUpRight, Trash2, Archive, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ConfidenceChip, type Confidence } from "@/components/badges"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ideaRef, relativeTime } from "@/lib/format"
import {
  createIdea,
  setDisposition,
  dropIdea,
  promoteIdea,
} from "@/app/actions/ideas"
import type { Idea } from "@/lib/db/schema"
import { Lightbulb } from "lucide-react"

const TYPES = ["Feature", "Bug", "Tech debt", "Agent", "Research", "Other"]
const RATING = ["S", "M", "L"]
const CONF = ["H", "M", "L"]
const FILTERS = ["All", "New", "Promote", "Parked", "Drop"] as const

const dispositionLabel: Record<string, string> = {
  New: "New",
  Promote: "Promoted",
  Parked: "Parked",
  Drop: "Dropped",
}

export function IdeasBoard({ initialIdeas }: { initialIdeas: Idea[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [addOpen, setAddOpen] = useState(false)
  const [dropFor, setDropFor] = useState<Idea | null>(null)
  const [dropReason, setDropReason] = useState("")

  // Add form state
  const [problem, setProblem] = useState("")
  const [raisedBy, setRaisedBy] = useState("")
  const [ideaType, setIdeaType] = useState("Feature")
  const [roughValue, setRoughValue] = useState("M")
  const [roughEffort, setRoughEffort] = useState("M")
  const [confidence, setConfidence] = useState("M")

  const visible = initialIdeas.filter((i) =>
    filter === "All" ? true : i.disposition === filter,
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem.trim()) return
    startTransition(async () => {
      try {
        await createIdea({
          problem,
          raisedBy,
          ideaType,
          roughValue,
          roughEffort,
          confidence,
        })
        toast("Idea added to the backlog.")
        setProblem("")
        setRaisedBy("")
        setAddOpen(false)
        router.refresh()
      } catch {
        toast("Could not add idea.", "error")
      }
    })
  }

  const handlePromote = (id: number) => {
    startTransition(async () => {
      try {
        await promoteIdea(id)
        toast("Idea promoted to a request.")
        router.refresh()
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not promote.", "error")
      }
    })
  }

  const handleDisposition = (id: number, d: string) => {
    startTransition(async () => {
      await setDisposition(id, d)
      router.refresh()
    })
  }

  const handleDrop = () => {
    if (!dropFor) return
    startTransition(async () => {
      try {
        await dropIdea(dropFor.id, dropReason)
        toast("Idea dropped with a reason logged.")
        setDropFor(null)
        setDropReason("")
        router.refresh()
      } catch (err) {
        toast(err instanceof Error ? err.message : "Reason required.", "error")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter ideas">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (filter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              {f}
              {f !== "All" && (
                <span className="ml-1.5 tabular text-xs opacity-70">
                  {initialIdeas.filter((i) => i.disposition === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add idea
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas here yet"
          description="Capture rough problems and opportunities before they're ready to become formal requests."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add idea
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((idea) => (
            <Card key={idea.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {ideaRef(idea.id)}
                  </span>
                  <span
                    className={
                      "rounded-md border px-1.5 py-0.5 text-[11px] font-medium " +
                      (idea.disposition === "Drop"
                        ? "border-border bg-secondary text-muted-foreground line-through"
                        : idea.disposition === "Promote"
                          ? "border-transparent bg-foreground text-background"
                          : "border-border bg-card text-muted-foreground")
                    }
                  >
                    {dispositionLabel[idea.disposition] ?? idea.disposition}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed text-foreground text-pretty">
                  {idea.problem}
                </p>

                {idea.dropReason && (
                  <p className="rounded-md bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                    Reason: {idea.dropReason}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {idea.ideaType && (
                    <span className="rounded-md border border-border px-1.5 py-0.5">
                      {idea.ideaType}
                    </span>
                  )}
                  <span className="rounded-md border border-border px-1.5 py-0.5">
                    Value {idea.roughValue ?? "—"}
                  </span>
                  <span className="rounded-md border border-border px-1.5 py-0.5">
                    Effort {idea.roughEffort ?? "—"}
                  </span>
                  {idea.confidence && (
                    <ConfidenceChip level={idea.confidence as Confidence} />
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {idea.raisedBy ? `${idea.raisedBy} · ` : ""}
                    {relativeTime(idea.createdAt)}
                  </span>
                </div>

                {idea.disposition !== "Drop" && !idea.promoted && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handlePromote(idea.id)}
                      disabled={pending}
                    >
                      <ArrowUpRight className="size-3.5" /> Promote
                    </Button>
                    {idea.disposition !== "Parked" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisposition(idea.id, "Parked")}
                        disabled={pending}
                      >
                        <Archive className="size-3.5" /> Park
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisposition(idea.id, "New")}
                        disabled={pending}
                      >
                        <RotateCcw className="size-3.5" /> Reopen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDropFor(idea)}
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" /> Drop
                    </Button>
                  </div>
                )}

                {idea.promoted && (
                  <p className="text-xs font-medium text-foreground">
                    Now tracked as a request.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add idea dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add idea</DialogTitle>
            <DialogDescription>
              A lightweight capture — no commitment. Score and promote later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="problem">Problem / opportunity *</Label>
              <Textarea
                id="problem"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                placeholder="What's the pain, and for whom?"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="raisedBy">Raised by</Label>
                <Input
                  id="raisedBy"
                  value={raisedBy}
                  onChange={(e) => setRaisedBy(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ideaType">Type</Label>
                <Select
                  id="ideaType"
                  value={ideaType}
                  onChange={(e) => setIdeaType(e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rv">Value</Label>
                <Select id="rv" value={roughValue} onChange={(e) => setRoughValue(e.target.value)}>
                  {RATING.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="re">Effort</Label>
                <Select id="re" value={roughEffort} onChange={(e) => setRoughEffort(e.target.value)}>
                  {RATING.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cf">Confidence</Label>
                <Select id="cf" value={confidence} onChange={(e) => setConfidence(e.target.value)}>
                  {CONF.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Adding…" : "Add idea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Drop reason dialog */}
      <Dialog open={!!dropFor} onOpenChange={(o) => !o && setDropFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop idea</DialogTitle>
            <DialogDescription>
              Dropping keeps the record for the audit trail. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
              rows={3}
              placeholder="e.g. Duplicate of I-004; low value vs. effort."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDropFor(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDrop} disabled={pending}>
              Drop idea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

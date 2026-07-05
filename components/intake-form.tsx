"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/toast"
import { createRequest } from "@/app/actions/requests"

const BUCKETS = ["Client", "Internal"]
const TYPES = ["Feature", "Bug", "Tech debt", "Performance", "Compliance", "Research"]
const SOURCES = ["Client call", "Support ticket", "Sales", "Eng", "Legal", "PO", "Internal", "Other"]

export function IntakeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [bucket, setBucket] = useState("Client")
  const [reqType, setReqType] = useState("Feature")
  const [source, setSource] = useState("Client call")
  const [neededBy, setNeededBy] = useState("")
  const [description, setDescription] = useState("")
  const [links, setLinks] = useState<string[]>([])
  const [linkDraft, setLinkDraft] = useState("")
  const [error, setError] = useState("")

  const addLink = () => {
    const v = linkDraft.trim()
    if (!v) return
    setLinks((l) => [...l, v])
    setLinkDraft("")
  }

  const removeLink = (i: number) =>
    setLinks((l) => l.filter((_, idx) => idx !== i))

  const reset = () => {
    setTitle("")
    setBucket("Client")
    setReqType("Feature")
    setSource("Client call")
    setNeededBy("")
    setDescription("")
    setLinks([])
    setLinkDraft("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!title.trim()) {
      setError("A short, clear title is required.")
      return
    }
    startTransition(async () => {
      try {
        await createRequest({
          title,
          bucket,
          reqType,
          source,
          neededBy: neededBy || null,
          description,
          refLinks: links,
        })
        toast("Request captured and sent to intake.")
        reset()
        router.push("/requests")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Title <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client billing export runs nightly"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              One line. What outcome is being asked for?
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, the underlying problem, who is affected, and any constraints."
              rows={6}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="link">Reference links</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    addLink()
                  }
                }}
                placeholder="https://…  (ticket, doc, thread)"
              />
              <Button type="button" variant="outline" onClick={addLink}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {links.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1.5">
                {links.map((l, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-1.5"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">{l}</span>
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${l}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Meta column */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bucket">Bucket</Label>
            <Select id="bucket" value={bucket} onChange={(e) => setBucket(e.target.value)}>
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Client-facing work vs. internal investment.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type</Label>
            <Select id="type" value={reqType} onChange={(e) => setReqType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source">Source</Label>
            <Select id="source" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="neededBy">Needed by</Label>
            <Input
              id="neededBy"
              type="date"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A target, not a commitment. Priority is set at triage.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          <Send className="size-4" />
          {pending ? "Submitting…" : "Submit intake"}
        </Button>
        <Button type="button" variant="ghost" onClick={reset} disabled={pending}>
          Clear
        </Button>
      </div>
    </form>
  )
}

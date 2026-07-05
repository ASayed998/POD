"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ListChecks } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import {
  PriorityBadge,
  StatusBadge,
  type PriorityBand,
  type RequestStatus,
} from "@/components/badges"
import { EmptyState } from "@/components/empty-state"
import { requestRef, formatDate, isOverdue } from "@/lib/format"
import type { Request } from "@/lib/db/schema"
import { TriangleAlert } from "lucide-react"

const STATUSES = [
  "All",
  "Intake",
  "Triaged",
  "In Refinement",
  "Ready",
  "In Sprint",
  "In Progress",
  "In Review",
  "Blocked",
  "Done",
  "Dropped",
]
const BUCKETS = ["All", "Client", "Internal"]
const BANDS = ["All", "P1", "P2", "P3", "P4"]

export function RequestTracker({ requests }: { requests: Request[] }) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("All")
  const [bucket, setBucket] = useState("All")
  const [band, setBand] = useState("All")

  const filtered = requests.filter((r) => {
    if (q && !r.title.toLowerCase().includes(q.toLowerCase()) && !requestRef(r.id).toLowerCase().includes(q.toLowerCase()))
      return false
    if (status !== "All" && r.status !== status) return false
    if (bucket !== "All" && r.bucket !== bucket) return false
    if (band !== "All" && r.priorityBand !== band) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or ref…"
            className="pl-9"
            aria-label="Search requests"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </Select>
          <Select value={bucket} onChange={(e) => setBucket(e.target.value)} aria-label="Bucket filter">
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b === "All" ? "All buckets" : b}
              </option>
            ))}
          </Select>
          <Select value={band} onChange={(e) => setBand(e.target.value)} aria-label="Priority filter">
            {BANDS.map((b) => (
              <option key={b} value={b}>
                {b === "All" ? "All bands" : b}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground tabular">
        {filtered.length} of {requests.length} requests
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No matching requests"
          description="Try clearing filters or adjusting your search to see more of the queue."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Ref</TH>
              <TH>Title</TH>
              <TH className="text-center">Band</TH>
              <TH className="text-center">Score</TH>
              <TH>Status</TH>
              <TH>Bucket</TH>
              <TH>Owner</TH>
              <TH>Needed by</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((r) => (
              <TR key={r.id} className="hover:bg-secondary/40">
                <TD className="font-mono text-xs text-muted-foreground">
                  {requestRef(r.id)}
                </TD>
                <TD className="max-w-[26ch] truncate font-medium">
                  <Link href={`/requests/${r.id}`} className="hover:underline">
                    {r.title}
                  </Link>
                </TD>
                <TD className="text-center">
                  {r.priorityBand ? (
                    <PriorityBadge band={r.priorityBand as PriorityBand} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TD>
                <TD className="text-center tabular">{r.priorityScore ?? "—"}</TD>
                <TD>
                  <StatusBadge status={r.status as RequestStatus} />
                </TD>
                <TD className="text-muted-foreground">{r.bucket}</TD>
                <TD className="text-muted-foreground">{r.owner ?? "—"}</TD>
                <TD
                  className={
                    isOverdue(r.neededBy, r.status)
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {isOverdue(r.neededBy, r.status) && (
                      <TriangleAlert className="size-3.5" aria-label="Overdue" />
                    )}
                    {formatDate(r.neededBy)}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}

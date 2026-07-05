"use server"

import { db } from "@/lib/db"
import { requests } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { isOverdue } from "@/lib/format"

export async function getDashboardData() {
  await requireUser()
  const all = await db.select().from(requests)

  const active = all.filter((r) => r.status !== "Dropped")
  const done = all.filter((r) => r.status === "Done")
  const inSprint = all.filter((r) =>
    ["In Sprint", "In Progress", "In Review"].includes(r.status),
  )
  const ready = all.filter((r) => r.status === "Ready")
  const inRefinement = all.filter((r) => r.status === "In Refinement")
  const overdue = all.filter((r) => isOverdue(r.neededBy, r.status))
  const blocked = all.filter((r) => r.status === "Blocked")

  const p1 = active.filter((r) => r.priorityBand === "P1")
  const p2 = active.filter((r) => r.priorityBand === "P2")
  const clientOpen = active.filter(
    (r) => r.bucket === "Client" && r.status !== "Done",
  )
  const internalOpen = active.filter(
    (r) => r.bucket === "Internal" && r.status !== "Done",
  )
  const scored = active.filter((r) => typeof r.priorityScore === "number")
  const avgScore = scored.length
    ? Math.round(
        scored.reduce((s, r) => s + (r.priorityScore ?? 0), 0) / scored.length,
      )
    : 0

  const openTotal = clientOpen.length + internalOpen.length
  const clientMix = openTotal ? Math.round((clientOpen.length / openTotal) * 100) : 0

  // Open queue by band (active, not done/dropped)
  const openQueue = active
    .filter((r) => !["Done"].includes(r.status))
    .sort((a, b) => (b.priorityScore ?? -1) - (a.priorityScore ?? -1))

  return {
    kpis: {
      total: all.length,
      inSprint: inSprint.length,
      ready: ready.length,
      inRefinement: inRefinement.length,
      done: done.length,
      overdue: overdue.length,
      p1: p1.length,
      p2: p2.length,
      clientOpen: clientOpen.length,
      internalOpen: internalOpen.length,
      clientMix,
      avgScore,
    },
    openQueue: openQueue.slice(0, 8),
    overdueList: overdue.slice(0, 6),
    blockedList: blocked.slice(0, 6),
    empty: all.length === 0,
  }
}

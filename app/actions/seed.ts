"use server"

import { db } from "@/lib/db"
import { requests, ideas, sprintItems } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { computeScore, scoreToBand } from "@/lib/format"
import { SPRINT_NAME } from "./sprint"
import { revalidatePath } from "next/cache"

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

export async function seedSampleData() {
  const user = await requireUser()

  const existing = await db.select().from(requests)
  if (existing.length > 0) return { skipped: true }

  const seedReqs = [
    { title: "Client billing export runs nightly", bucket: "Client", reqType: "Feature", owner: "Priya N.", source: "Client call", status: "Ready", neededBy: daysFromNow(6), f: [5, 4, 5, 4], risk: false },
    { title: "Duplicate invoices on retry", bucket: "Client", reqType: "Bug", owner: "Marco R.", source: "Support ticket", status: "In Progress", neededBy: daysFromNow(-2), f: [5, 3, 5, 3], risk: false },
    { title: "Self-serve seat management", bucket: "Client", reqType: "Feature", owner: "Priya N.", source: "Sales", status: "Triaged", neededBy: daysFromNow(20), f: [4, 5, 3, 4], risk: false },
    { title: "Migrate legacy auth to SSO", bucket: "Internal", reqType: "Tech debt", owner: "Dana K.", source: "Eng", status: "In Refinement", neededBy: daysFromNow(14), f: [3, 2, 4, 5], risk: false },
    { title: "Unmanaged client data cleanup", bucket: "Client", reqType: "Compliance", owner: "Dana K.", source: "Legal", status: "Triaged", neededBy: daysFromNow(9), f: [5, 4, 5, 5], risk: true },
    { title: "Dashboard load feels slow", bucket: "Internal", reqType: "Performance", owner: "Marco R.", source: "Internal", status: "Ready", neededBy: daysFromNow(11), f: [3, 3, 3, 2], risk: false },
    { title: "Weekly ops digest email", bucket: "Internal", reqType: "Feature", owner: null, source: "PO", status: "Intake", neededBy: daysFromNow(25), f: null, risk: false },
    { title: "Export to CSV for finance", bucket: "Client", reqType: "Feature", owner: "Priya N.", source: "Client call", status: "Blocked", neededBy: daysFromNow(4), f: [4, 3, 4, 3], risk: false },
  ] as const

  for (const r of seedReqs) {
    const scored = r.f
      ? {
          factorValue: r.f[0],
          factorReach: r.f[1],
          factorUrgency: r.f[2],
          factorStrategic: r.f[3],
        }
      : {}
    const score = r.f ? computeScore(scored) : null
    const band = score != null ? scoreToBand(score, r.risk) : null

    await db.insert(requests).values({
      title: r.title,
      bucket: r.bucket,
      reqType: r.reqType,
      owner: r.owner,
      source: r.source,
      status: r.status,
      stageGate: r.status === "Ready" ? "Passed" : "Not Started",
      neededBy: r.neededBy,
      riskGate: r.risk,
      priorityScore: score,
      priorityBand: band,
      ...scored,
      createdBy: user.id,
    })
  }

  const seedIdeas = [
    { problem: "Bulk-approve intake requests", raisedBy: "Marco R.", source: "Standup", ideaType: "Feature", roughValue: "M", roughEffort: "S", confidence: "H" },
    { problem: "Slack alerts for overdue items", raisedBy: "Priya N.", source: "Retro", ideaType: "Feature", roughValue: "M", roughEffort: "M", confidence: "M" },
    { problem: "AI summary of interview notes", raisedBy: "Dana K.", source: "Client interview", ideaType: "Agent", roughValue: "L", roughEffort: "L", confidence: "L" },
  ] as const

  for (const i of seedIdeas) {
    await db.insert(ideas).values({ ...i, createdBy: user.id })
  }

  // Commit a couple of ready/in-progress requests to the current sprint.
  const all = await db.select().from(requests)
  const inProg = all.find((r) => r.title.startsWith("Duplicate invoices"))
  const blocked = all.find((r) => r.title.startsWith("Export to CSV"))
  if (inProg) {
    await db.insert(sprintItems).values({
      requestId: inProg.id,
      sprintName: SPRINT_NAME,
      boardStatus: "In Progress",
      percentComplete: 60,
      estDays: 5,
      bucket: "Client",
      createdBy: user.id,
    })
  }
  if (blocked) {
    await db.insert(sprintItems).values({
      requestId: blocked.id,
      sprintName: SPRINT_NAME,
      boardStatus: "Blocked",
      percentComplete: 20,
      blocker: "Waiting on finance schema sign-off",
      estDays: 3,
      bucket: "Client",
      createdBy: user.id,
    })
  }

  revalidatePath("/")
  revalidatePath("/requests")
  revalidatePath("/ideas")
  revalidatePath("/sprint")
  return { skipped: false }
}

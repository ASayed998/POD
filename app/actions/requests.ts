"use server"

import { db } from "@/lib/db"
import { requests, ideas } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { computeScore, scoreToBand } from "@/lib/format"
import { and, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getRequests() {
  await requireUser()
  return db.select().from(requests).orderBy(desc(requests.priorityScore), desc(requests.createdAt))
}

export async function getRequest(id: number) {
  await requireUser()
  const [row] = await db.select().from(requests).where(eq(requests.id, id))
  return row ?? null
}

export async function createRequest(input: {
  title: string
  source?: string
  bucket: string
  reqType?: string
  neededBy?: string | null
  refLinks?: string[]
  description?: string
}) {
  const user = await requireUser()
  if (!input.title?.trim()) throw new Error("Title is required.")

  const [row] = await db
    .insert(requests)
    .values({
      title: input.title.trim(),
      source: input.source || null,
      bucket: input.bucket || "Client",
      reqType: input.reqType || null,
      neededBy: input.neededBy ? new Date(input.neededBy) : null,
      refLinks: input.refLinks?.length ? JSON.stringify(input.refLinks) : null,
      description: input.description || null,
      status: "Intake",
      createdBy: user.id,
    })
    .returning()

  revalidatePath("/requests")
  revalidatePath("/")
  return row
}

const STATUS_FLOW: Record<string, string[]> = {
  Intake: ["Triaged", "Dropped"],
  Triaged: ["In Refinement", "Dropped"],
  "In Refinement": ["Ready", "Triaged"],
  Ready: ["In Sprint"],
  "In Sprint": ["In Progress", "Blocked"],
  "In Progress": ["In Review", "Blocked"],
  "In Review": ["Done", "In Progress"],
  Blocked: ["In Progress"],
}

export async function nextStatuses(current: string) {
  return STATUS_FLOW[current] ?? []
}

export async function advanceStatus(id: number, status: string) {
  await requireUser()
  await db
    .update(requests)
    .set({ status, updatedAt: new Date() })
    .where(eq(requests.id, id))
  revalidatePath("/requests")
  revalidatePath(`/requests/${id}`)
  revalidatePath("/")
}

export async function updateRequestFields(
  id: number,
  fields: {
    title?: string
    owner?: string
    neededBy?: string | null
    description?: string
    bucket?: string
    stageGate?: string
  },
) {
  await requireUser()
  await db
    .update(requests)
    .set({
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.owner !== undefined ? { owner: fields.owner || null } : {}),
      ...(fields.description !== undefined
        ? { description: fields.description || null }
        : {}),
      ...(fields.bucket !== undefined ? { bucket: fields.bucket } : {}),
      ...(fields.stageGate !== undefined ? { stageGate: fields.stageGate } : {}),
      ...(fields.neededBy !== undefined
        ? { neededBy: fields.neededBy ? new Date(fields.neededBy) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, id))
  revalidatePath("/requests")
  revalidatePath(`/requests/${id}`)
}

// Scoring engine (SSOT). Persists factors + computed score/band on the request.
export async function saveScore(
  id: number,
  factors: {
    factorValue: number
    factorReach: number
    factorUrgency: number
    factorStrategic: number
    riskGate: boolean
  },
) {
  await requireUser()
  const score = computeScore(factors)
  const band = scoreToBand(score, factors.riskGate)

  const [current] = await db.select().from(requests).where(eq(requests.id, id))

  await db
    .update(requests)
    .set({
      factorValue: factors.factorValue,
      factorReach: factors.factorReach,
      factorUrgency: factors.factorUrgency,
      factorStrategic: factors.factorStrategic,
      riskGate: factors.riskGate,
      priorityScore: score,
      priorityBand: band,
      status: current?.status === "Intake" ? "Triaged" : current?.status,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, id))

  revalidatePath("/triage")
  revalidatePath("/requests")
  revalidatePath("/")
  return { score, band }
}

export async function getTriageQueue() {
  await requireUser()
  // Requests not yet in a sprint, ranked by score (unscored last).
  return db
    .select()
    .from(requests)
    .where(
      and(
        sql`${requests.status} not in ('Done','Dropped','In Sprint','In Progress','In Review')`,
      ),
    )
    .orderBy(desc(requests.priorityScore), desc(requests.createdAt))
}

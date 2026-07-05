"use server"

import { db } from "@/lib/db"
import { sprintItems, requests } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const SPRINT_NAME = "Sprint 24"
export const SPRINT_CAPACITY_DAYS = 40 // total pod-days
export const CLIENT_RATIO = 0.7
export const INTERNAL_RATIO = 0.3

export async function getSprintBoard() {
  await requireUser()
  const items = await db
    .select({
      id: sprintItems.id,
      requestId: sprintItems.requestId,
      sprintName: sprintItems.sprintName,
      boardStatus: sprintItems.boardStatus,
      percentComplete: sprintItems.percentComplete,
      blocker: sprintItems.blocker,
      estDays: sprintItems.estDays,
      bucket: sprintItems.bucket,
      title: requests.title,
      priorityBand: requests.priorityBand,
      priorityScore: requests.priorityScore,
      owner: requests.owner,
    })
    .from(sprintItems)
    .leftJoin(requests, eq(sprintItems.requestId, requests.id))
    .where(eq(sprintItems.sprintName, SPRINT_NAME))
    .orderBy(desc(requests.priorityScore))

  return items
}

// "Ready" requests eligible to be pulled into the sprint (gate = Ready/Passed).
export async function getReadyRequests() {
  await requireUser()
  const committed = await db
    .select({ requestId: sprintItems.requestId })
    .from(sprintItems)
    .where(eq(sprintItems.sprintName, SPRINT_NAME))
  const committedIds = new Set(committed.map((c) => c.requestId))

  const ready = await db
    .select()
    .from(requests)
    .where(eq(requests.status, "Ready"))
    .orderBy(desc(requests.priorityScore))

  return ready.filter((r) => !committedIds.has(r.id))
}

export async function getCapacity() {
  await requireUser()
  const items = await db
    .select()
    .from(sprintItems)
    .where(eq(sprintItems.sprintName, SPRINT_NAME))
  const clientUsed = items
    .filter((i) => i.bucket === "Client")
    .reduce((s, i) => s + i.estDays, 0)
  const internalUsed = items
    .filter((i) => i.bucket === "Internal")
    .reduce((s, i) => s + i.estDays, 0)
  return {
    total: SPRINT_CAPACITY_DAYS,
    clientCap: Math.round(SPRINT_CAPACITY_DAYS * CLIENT_RATIO),
    internalCap: Math.round(SPRINT_CAPACITY_DAYS * INTERNAL_RATIO),
    clientUsed,
    internalUsed,
  }
}

export async function commitToSprint(input: {
  requestId: number
  estDays: number
  bucket: string
  override?: boolean
  overrideReason?: string
}) {
  const user = await requireUser()

  const cap = await getCapacity()
  const projected =
    input.bucket === "Client"
      ? cap.clientUsed + input.estDays
      : cap.internalUsed + input.estDays
  const limit = input.bucket === "Client" ? cap.clientCap : cap.internalCap
  const breach = projected > limit

  if (breach && !input.override) {
    return { ok: false as const, breach: true, projected, limit }
  }

  await db.insert(sprintItems).values({
    requestId: input.requestId,
    sprintName: SPRINT_NAME,
    boardStatus: "Committed",
    estDays: input.estDays,
    bucket: input.bucket,
    blocker:
      breach && input.override
        ? `Capacity override: ${input.overrideReason ?? "no reason given"}`
        : null,
    createdBy: user.id,
  })

  await db
    .update(requests)
    .set({ status: "In Sprint", updatedAt: new Date() })
    .where(eq(requests.id, input.requestId))

  revalidatePath("/sprint")
  revalidatePath("/requests")
  revalidatePath("/")
  return { ok: true as const, breach }
}

export async function updateSprintItem(
  id: number,
  fields: { boardStatus?: string; percentComplete?: number; blocker?: string | null },
) {
  await requireUser()
  const [item] = await db
    .select()
    .from(sprintItems)
    .where(eq(sprintItems.id, id))
  if (!item) throw new Error("Sprint item not found.")

  await db
    .update(sprintItems)
    .set({
      ...(fields.boardStatus ? { boardStatus: fields.boardStatus } : {}),
      ...(fields.percentComplete !== undefined
        ? { percentComplete: fields.percentComplete }
        : {}),
      ...(fields.blocker !== undefined ? { blocker: fields.blocker } : {}),
    })
    .where(eq(sprintItems.id, id))

  // Mirror lifecycle onto the request record.
  const statusMap: Record<string, string> = {
    Committed: "In Sprint",
    "In Progress": "In Progress",
    "In Review": "In Review",
    Done: "Done",
    Blocked: "Blocked",
  }
  if (fields.boardStatus && statusMap[fields.boardStatus]) {
    await db
      .update(requests)
      .set({ status: statusMap[fields.boardStatus], updatedAt: new Date() })
      .where(eq(requests.id, item.requestId))
  }

  revalidatePath("/sprint")
  revalidatePath("/requests")
  revalidatePath("/")
}

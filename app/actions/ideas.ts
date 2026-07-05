"use server"

import { db } from "@/lib/db"
import { ideas, requests } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getIdeas() {
  await requireUser()
  return db.select().from(ideas).orderBy(desc(ideas.createdAt))
}

export async function createIdea(input: {
  problem: string
  raisedBy?: string
  source?: string
  ideaType?: string
  roughValue?: string
  roughEffort?: string
  confidence?: string
}) {
  const user = await requireUser()
  if (!input.problem?.trim()) throw new Error("Idea / problem is required.")
  const [row] = await db
    .insert(ideas)
    .values({
      problem: input.problem.trim(),
      raisedBy: input.raisedBy || null,
      source: input.source || null,
      ideaType: input.ideaType || null,
      roughValue: input.roughValue || null,
      roughEffort: input.roughEffort || null,
      confidence: input.confidence || "M",
      createdBy: user.id,
    })
    .returning()
  revalidatePath("/ideas")
  return row
}

export async function setDisposition(id: number, disposition: string) {
  await requireUser()
  await db.update(ideas).set({ disposition }).where(eq(ideas.id, id))
  revalidatePath("/ideas")
}

export async function dropIdea(id: number, reason: string) {
  await requireUser()
  if (!reason?.trim()) throw new Error("A reason is required to drop an idea.")
  await db
    .update(ideas)
    .set({ disposition: "Drop", dropReason: reason.trim() })
    .where(eq(ideas.id, id))
  revalidatePath("/ideas")
}

// Promote an idea into a Request (carries fields + links back).
export async function promoteIdea(id: number) {
  const user = await requireUser()
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id))
  if (!idea) throw new Error("Idea not found.")
  if (idea.promoted) throw new Error("This idea has already been promoted.")

  const [req] = await db
    .insert(requests)
    .values({
      title: idea.problem,
      source: idea.source,
      bucket: "Client",
      reqType: idea.ideaType,
      description: `Promoted from idea I-${String(idea.id).padStart(3, "0")}.`,
      status: "Intake",
      ideaId: idea.id,
      createdBy: user.id,
    })
    .returning()

  await db
    .update(ideas)
    .set({ promoted: true, disposition: "Promote", requestId: req.id })
    .where(eq(ideas.id, id))

  revalidatePath("/ideas")
  revalidatePath("/requests")
  revalidatePath("/")
  return req
}

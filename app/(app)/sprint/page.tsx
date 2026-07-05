import { PageHeader } from "@/components/page-header"
import { SprintBoard } from "@/components/sprint-board"
import {
  getSprintBoard,
  getReadyRequests,
  getCapacity,
} from "@/app/actions/sprint"
import { SPRINT_NAME } from "@/lib/sprint-config"

export const metadata = { title: "Sprint Board — Pod OS" }

export default async function SprintPage() {
  const [items, ready, capacity] = await Promise.all([
    getSprintBoard(),
    getReadyRequests(),
    getCapacity(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sprint board"
        description="Commit ready work within capacity, then track it across stages. Client and internal budgets are protected by a 70/30 split."
      />
      <SprintBoard
        sprintName={SPRINT_NAME}
        items={items}
        ready={ready}
        capacity={capacity}
      />
    </div>
  )
}

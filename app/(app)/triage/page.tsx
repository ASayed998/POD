import { PageHeader } from "@/components/page-header"
import { TriagePanel } from "@/components/triage-panel"
import { getTriageQueue } from "@/app/actions/requests"

export const metadata = { title: "Triage & Scoring — Pod OS" }

export default async function TriagePage() {
  const queue = await getTriageQueue()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Triage & scoring"
        description="Turn raw intake into a ranked queue. Score each request on value, urgency, strategic fit, and reach — the band updates live."
      />
      <TriagePanel queue={queue} />
    </div>
  )
}

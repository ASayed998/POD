import { PageHeader } from "@/components/page-header"
import { IntakeForm } from "@/components/intake-form"

export const metadata = { title: "Intake Form — Pod OS" }

export default function IntakePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="New intake"
        description="Capture a request once, with enough context to triage it later. Everything lands in the intake queue at P—, unscored."
      />
      <IntakeForm />
    </div>
  )
}

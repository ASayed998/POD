import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { RequestTracker } from "@/components/request-tracker"
import { Button } from "@/components/ui/button"
import { getRequests } from "@/app/actions/requests"

export const metadata = { title: "Request Tracker — Pod OS" }

export default async function RequestsPage() {
  const requests = await getRequests()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Request tracker"
        description="Every request in one ranked list, from intake to done. Filter by status, bucket, or priority band."
        actions={
          <Button asChild>
            <Link href="/intake">New intake</Link>
          </Button>
        }
      />
      <RequestTracker requests={requests} />
    </div>
  )
}

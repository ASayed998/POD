import { notFound } from "next/navigation"
import { RequestDetail } from "@/components/request-detail"
import { getRequest, nextStatuses } from "@/app/actions/requests"

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const request = await getRequest(Number(id))
  if (!request) notFound()
  const nextOptions = await nextStatuses(request.status)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <RequestDetail request={request} nextOptions={nextOptions} />
    </div>
  )
}

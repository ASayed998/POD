import { PageHeader } from "@/components/page-header"
import { IdeasBoard } from "@/components/ideas-board"
import { getIdeas } from "@/app/actions/ideas"

export const metadata = { title: "Ideas Backlog — Pod OS" }

export default async function IdeasPage() {
  const ideas = await getIdeas()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ideas backlog"
        description="A holding area for rough problems and opportunities. Promote the good ones into requests; drop the rest with a reason."
      />
      <IdeasBoard initialIdeas={ideas} />
    </div>
  )
}

import Link from "next/link"
import {
  LayoutDashboard,
  Columns3,
  CircleCheck,
  Clock,
  TriangleAlert,
  Gauge,
  Users,
  Building2,
  ArrowUpRight,
  Ban,
} from "lucide-react"
import { getDashboardData } from "@/app/actions/dashboard"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { SeedButton } from "@/components/seed-button"
import { PriorityBadge, StatusBadge, type PriorityBand, type RequestStatus } from "@/components/badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { requestRef, formatDate, isOverdue } from "@/lib/format"

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (data.empty) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard"
          description="A single view of the pod's intake, priorities, and delivery."
        />
        <EmptyState
          icon={LayoutDashboard}
          title="Your workspace is empty"
          description="Load a sample workspace to explore Pod OS with realistic requests, ideas, and an active sprint — or start by adding your first intake."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <SeedButton />
              <Button variant="outline" asChild>
                <Link href="/intake">New intake</Link>
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const k = data.kpis

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="A single view of the pod's intake, priorities, and delivery."
        actions={
          <Button asChild>
            <Link href="/intake">New intake</Link>
          </Button>
        }
      />

      {/* KPI grid */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="In sprint" value={k.inSprint} icon={Columns3} emphasis />
        <StatCard label="Ready" value={k.ready} hint="Passed stage gate" icon={CircleCheck} />
        <StatCard label="In refinement" value={k.inRefinement} icon={Clock} />
        <StatCard
          label="Overdue"
          value={k.overdue}
          hint={k.overdue > 0 ? "Needs attention" : "All on track"}
          icon={TriangleAlert}
        />
      </section>

      <section aria-label="Portfolio balance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="P1 open" value={k.p1} icon={Gauge} />
        <StatCard label="P2 open" value={k.p2} icon={Gauge} />
        <StatCard label="Client / Internal" value={`${k.clientOpen} / ${k.internalOpen}`} hint={`${k.clientMix}% client mix`} icon={Users} />
        <StatCard label="Avg score" value={k.avgScore} hint="Weighted, 0–100" icon={Building2} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Open queue */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open priority queue</CardTitle>
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Ref</TH>
                  <TH>Request</TH>
                  <TH className="text-center">Band</TH>
                  <TH className="text-center">Score</TH>
                  <TH>Status</TH>
                  <TH>Needed by</TH>
                </TR>
              </THead>
              <TBody>
                {data.openQueue.map((r) => (
                  <TR key={r.id} className="hover:bg-secondary/40">
                    <TD className="font-mono text-xs text-muted-foreground">
                      {requestRef(r.id)}
                    </TD>
                    <TD className="max-w-[22ch] truncate font-medium">
                      <Link href={`/requests/${r.id}`} className="hover:underline">
                        {r.title}
                      </Link>
                    </TD>
                    <TD className="text-center">
                      {r.priorityBand ? (
                        <PriorityBadge band={r.priorityBand as PriorityBand} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TD>
                    <TD className="text-center tabular">
                      {r.priorityScore ?? "—"}
                    </TD>
                    <TD>
                      <StatusBadge status={r.status as RequestStatus} />
                    </TD>
                    <TD
                      className={
                        isOverdue(r.neededBy, r.status)
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {isOverdue(r.neededBy, r.status) && (
                          <TriangleAlert className="size-3.5" aria-label="Overdue" />
                        )}
                        {formatDate(r.neededBy)}
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attention column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="size-4" /> Overdue
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {data.overdueList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing overdue. Nice.</p>
              ) : (
                data.overdueList.map((r) => (
                  <Link
                    key={r.id}
                    href={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 hover:bg-secondary/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {formatDate(r.neededBy)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="size-4" /> Blocked
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {data.blockedList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocked items.</p>
              ) : (
                data.blockedList.map((r) => (
                  <Link
                    key={r.id}
                    href={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 hover:bg-secondary/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{r.title}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {requestRef(r.id)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

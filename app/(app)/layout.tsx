import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { Sidebar } from "@/components/sidebar"
import { ToastProvider } from "@/components/toast"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  return (
    <ToastProvider>
      <div className="min-h-svh">
        <Sidebar user={{ name: user.name, email: user.email }} />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

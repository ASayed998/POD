"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  Boxes,
  LayoutDashboard,
  FilePlus2,
  Lightbulb,
  ListChecks,
  SlidersHorizontal,
  Columns3,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intake", label: "Intake Form", icon: FilePlus2 },
  { href: "/ideas", label: "Ideas Backlog", icon: Lightbulb },
  { href: "/requests", label: "Request Tracker", icon: ListChecks },
  { href: "/triage", label: "Triage & Scoring", icon: SlidersHorizontal },
  { href: "/sprint", label: "Sprint Board", icon: Columns3 },
]

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Primary">
      {nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              strokeWidth={2}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const Brand = (
    <div className="flex items-center gap-2.5 px-5 h-14">
      <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
        <Boxes className="size-4" />
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Pod OS
      </span>
    </div>
  )

  const Footer = (
    <div className="mt-auto border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground tabular">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name ?? "Pod member"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Boxes className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Pod OS</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {Brand}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="py-2">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            {Footer}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card">
        {Brand}
        <div className="py-2">
          <NavLinks pathname={pathname} />
        </div>
        {Footer}
      </aside>
    </>
  )
}

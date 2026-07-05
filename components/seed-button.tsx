"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"
import { seedSampleData } from "@/app/actions/seed"

export function SeedButton({
  variant = "default",
  label = "Load sample data",
}: {
  variant?: "default" | "outline" | "ghost"
  label?: string
}) {
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSeed = () => {
    setBusy(true)
    startTransition(async () => {
      try {
        const res = await seedSampleData()
        if (res.skipped) {
          toast("Workspace already has data — nothing to seed.", "error")
        } else {
          toast("Sample workspace loaded.")
          router.refresh()
        }
      } catch {
        toast("Could not load sample data.", "error")
      } finally {
        setBusy(false)
      }
    })
  }

  return (
    <Button variant={variant} onClick={handleSeed} disabled={pending || busy}>
      <Sparkles className="size-4" />
      {busy ? "Loading…" : label}
    </Button>
  )
}

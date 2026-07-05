"use client"

import * as React from "react"
import { createContext, useContext, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogCtx = createContext<{ onOpenChange: (open: boolean) => void } | null>(
  null,
)

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <DialogCtx.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-foreground/25 backdrop-blur-[1px]"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
        {children}
      </div>
    </DialogCtx.Provider>
  )
}

export function DialogContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = useContext(DialogCtx)
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative w-full max-w-md rounded-xl border border-border bg-card shadow-xl animate-in",
        className,
      )}
    >
      <button
        onClick={() => ctx?.onOpenChange(false)}
        className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Close dialog"
      >
        <X className="size-4" />
      </button>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1 pr-6">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  )
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground text-pretty">{children}</p>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">{children}</div>
  )
}

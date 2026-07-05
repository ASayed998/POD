"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Toast = {
  id: number
  message: string
  variant: "success" | "error"
}

const ToastContext = createContext<{
  toast: (message: string, variant?: "success" | "error") => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, variant }])
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 5000)
    },
    [],
  )

  const dismiss = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-2.5 rounded-lg border border-border bg-card px-3.5 py-3 shadow-lg animate-in",
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-foreground" />
            ) : (
              <AlertCircle className="size-4 mt-0.5 shrink-0 text-foreground" />
            )}
            <p className="flex-1 text-sm text-foreground leading-relaxed">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

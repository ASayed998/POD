"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Boxes, AlertCircle } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-foreground p-12 text-background">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md border border-background/20 bg-background/5">
            <Boxes className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Pod OS</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-balance leading-snug">
            The operating system for your Agentic Pod.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-background/60">
            Intake, triage, refinement and sprint execution — one canonical
            source of truth, replacing the workbook.
          </p>
        </div>
        <p className="text-xs text-background/40 tabular">
          Internal tool · English (V1)
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <Boxes className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Pod OS</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Sign in to Pod OS"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? "Set up access for the Pod workspace."
              : "Welcome back. Enter your details to continue."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Alex Morgan"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@integrant.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
                aria-describedby={error ? "auth-error" : undefined}
              />
            </div>

            {error && (
              <div
                id="auth-error"
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading
                ? "Please wait…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? "Already have access? " : "Need an account? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

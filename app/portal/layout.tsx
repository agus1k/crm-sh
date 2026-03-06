"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { ThemeProvider } from "@/components/theme-provider"
import { PortalHeader } from "@/components/portal/portal-header"
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react"

function PortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setProfile, setOrganization, setLoading } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      setUser({ id: user.id, email: user.email! })

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        console.error("Error loading profile:", profileError?.message)
        setLoading(false)
        setChecked(true)
        return
      }

      // Only clients should be in the portal
      if (profile.role !== "cliente") {
        router.replace("/")
        return
      }

      setProfile(profile)

      if (profile.organization_id) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single()
        if (orgError) console.error("Error loading organization:", orgError.message)
        if (org) setOrganization(org)
      }

      setLoading(false)
      setChecked(true)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_OUT") {
          useAuthStore.getState().reset()
          router.replace("/login")
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, setUser, setProfile, setOrganization, setLoading])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PortalGuard>
        <div className="min-h-screen bg-background">
          <PortalHeader />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
        <Toaster position="bottom-right" />
      </PortalGuard>
    </ThemeProvider>
  )
}

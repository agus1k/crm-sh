"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAppStore } from "@/lib/stores/app-store"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setProfile, setOrganization, setLoading, isLoading, user } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      setUser({ id: user.id, email: user.email! })
      const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileError || !profile) {
        console.error("Error loading profile:", profileError?.message)
        setLoading(false); setChecked(true)
        return
      }

      setProfile(profile)
      if (profile.organization_id) {
        const { data: org, error: orgError } = await supabase.from("organizations").select("*").eq("id", profile.organization_id).single()
        if (orgError) console.error("Error loading organization:", orgError.message)
        if (org) setOrganization(org)
      }
      setLoading(false); setChecked(true)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          useAuthStore.getState().reset()
          router.replace("/login")
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router, setUser, setProfile, setOrganization, setLoading])

  if (!checked) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className={cn("transition-all duration-300 ease-in-out min-h-screen", sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]")}>
            {children}
          </main>
        </div>
        <Toaster position="bottom-right" />
      </AuthGuard>
    </ThemeProvider>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Search, Moon, Sun, Laptop, Command, Settings, LogOut, User as UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAppStore } from "@/lib/stores/app-store"

interface TopbarProps { title?: string; description?: string }

export function Topbar({ title, description }: TopbarProps) {
  const { setTheme, theme } = useTheme()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const isSearchOpen = useAppStore((s) => s.isSearchOpen)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearchOpen(!isSearchOpen) } }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isSearchOpen, setSearchOpen])

  const handleLogout = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.replace("/login") }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex flex-1 items-center gap-4 justify-between lg:justify-start">
        <div className="flex flex-col">
          {title && <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>}
          {description && <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden w-full max-w-sm sm:flex items-center">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar (Cmd+K)..." className="w-full rounded-full bg-muted/50 pl-9 pr-4 text-sm md:w-[240px] lg:w-[320px] focus-visible:ring-1 focus-visible:bg-background transition-colors" onClick={() => setSearchOpen(true)} readOnly />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="inline-flex items-center justify-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"><Command className="h-3 w-3 mr-0.5" /> K</kbd>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)}><Search className="h-4 w-4" /></Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-muted/50 border border-border/50 overflow-hidden">
                <span className="text-xs font-semibold text-foreground uppercase">{profile?.full_name?.charAt(0) || "U"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" alignOffset={-12}>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserIcon className="h-4 w-4" /></div>
                <div className="flex flex-col space-y-0.5 leading-none min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground w-[150px] truncate">{organization?.name}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/configuracion")}><Settings className="mr-2 h-4 w-4" /><span>Configuración</span></DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {mounted ? (theme === "dark" ? <Moon className="mr-2 h-4 w-4" /> : theme === "light" ? <Sun className="mr-2 h-4 w-4" /> : <Laptop className="mr-2 h-4 w-4" />) : <Sun className="mr-2 h-4 w-4" />}
                  <span>Apariencia</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" /> Claro</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" /> Oscuro</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}><Laptop className="mr-2 h-4 w-4" /> Sistema</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>Cerrar sesión</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

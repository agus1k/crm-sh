"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  FileText,
  Calendar,
  CalendarRange,
  ClipboardCheck,
  ListChecks,
  Gauge,
  Eye,
  AlertTriangle,
  ShieldAlert,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/stores/app-store"

type NavChild = {
  name: string
  href: string
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChild[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Building2 },
  { name: "Proyectos", href: "/proyectos", icon: FolderKanban },
  {
    name: "Informes",
    href: "/informes",
    icon: FileText,
    children: [
      { name: "Todos", href: "/informes" },
      { name: "Carga de Fuego", href: "/informes/nuevo/carga-de-fuego" },
    ],
  },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Plan Anual", href: "/plan-anual", icon: CalendarRange },
  { name: "Visitas", href: "/visitas", icon: ClipboardCheck },
  {
    name: "Checklists",
    href: "/checklists",
    icon: ListChecks,
    children: [
      { name: "Todos", href: "/checklists" },
      { name: "Plantillas", href: "/checklists/plantillas" },
    ],
  },
  { name: "Mediciones", href: "/mediciones", icon: Gauge },
  { name: "Riesgos", href: "/riesgos", icon: AlertTriangle },
  { name: "Incidentes", href: "/incidentes", icon: ShieldAlert },
  { name: "Observaciones", href: "/observaciones", icon: Eye },
]

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggle = useAppStore((s) => s.toggleSidebar)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const isItemActive = (item: NavItem) => {
    if (item.href === "/") return pathname === "/"
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  const isChildActive = (child: NavChild) => {
    // Exact match for "Todos" (/informes), startsWith for deeper routes
    if (child.href === "/informes") return pathname === "/informes"
    return pathname === child.href || pathname.startsWith(child.href + "/")
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-all duration-300 ease-in-out lg:flex",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4 py-4 justify-between">
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold">
              SH
            </span>
          </div>
          <span className="font-semibold text-foreground tracking-tight truncate">
            CRM
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted"
          onClick={toggle}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = isItemActive(item)
          const hasChildren = item.children && item.children.length > 0
          const isOpen = openMenus[item.name] ?? isActive

          if (hasChildren && !collapsed) {
            return (
              <div key={item.name} className="space-y-0.5">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-primary rounded-r-md" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate flex-1 text-left">
                    {item.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-7 space-y-0.5 border-l border-border pl-3">
                    {item.children!.map((child) => {
                      const childActive = isChildActive(child)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors",
                            childActive
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-primary rounded-r-md" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "truncate transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/ayuda"
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden",
            pathname.startsWith("/ayuda")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
          title={collapsed ? "Ayuda" : undefined}
        >
          {pathname.startsWith("/ayuda") && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-primary rounded-r-md" />
          )}
          <HelpCircle
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              pathname.startsWith("/ayuda")
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span
            className={cn(
              "truncate transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Ayuda
          </span>
        </Link>
        <Link
          href="/configuracion"
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden",
            pathname.startsWith("/configuracion")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
          title={collapsed ? "Configuración" : undefined}
        >
          {pathname.startsWith("/configuracion") && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 bg-primary rounded-r-md" />
          )}
          <Settings
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              pathname.startsWith("/configuracion")
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span
            className={cn(
              "truncate transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Configuración
          </span>
        </Link>
      </div>
    </aside>
  )
}

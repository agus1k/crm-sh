"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { StatCard, StatCardsGrid } from "@/components/portal/stat-cards"
import { FileText, Calendar, Eye, BarChart3, Loader2, Shield } from "lucide-react"
import Link from "next/link"

interface PortalStats {
  totalInformes: number
  proximosEventos: number
  observacionesPendientes: number
  cumplimiento: number
}

export default function PortalDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<PortalStats>({
    totalInformes: 0,
    proximosEventos: 0,
    observacionesPendientes: 0,
    cumplimiento: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!profile?.organization_id) {
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Find the client records for this organization
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("organization_id", profile.organization_id)

      const clientIds = clientData?.map((c) => c.id) || []

      if (clientIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch stats in parallel
      const [informesRes, eventosRes, obsRes, checklistsRes] = await Promise.all([
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .in("client_id", clientIds)
          .in("status", ["completado", "enviado"]),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .in("client_id", clientIds)
          .gte("start_date", new Date().toISOString().split("T")[0])
          .in("status", ["planificado", "pendiente"]),
        supabase
          .from("observations")
          .select("id", { count: "exact", head: true })
          .in("client_id", clientIds)
          .in("status", ["abierta", "en_proceso"]),
        supabase
          .from("checklists")
          .select("score")
          .in("client_id", clientIds)
          .eq("status", "completado"),
      ])

      const totalInformes = informesRes.count ?? 0
      const proximosEventos = eventosRes.count ?? 0
      const observacionesPendientes = obsRes.count ?? 0

      // Calculate average compliance score
      const scores = checklistsRes.data?.map((c) => c.score).filter((s): s is number => s !== null) ?? []
      const cumplimiento = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

      setStats({ totalInformes, proximosEventos, observacionesPendientes, cumplimiento })
      setLoading(false)
    }

    loadStats()
  }, [profile?.organization_id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {profile?.full_name || "Cliente"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen del estado de seguridad e higiene de tu empresa
        </p>
      </div>

      {/* Stats */}
      <StatCardsGrid>
        <StatCard
          title="Informes Completados"
          value={stats.totalInformes}
          description="Informes y protocolos disponibles"
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Proximos Eventos"
          value={stats.proximosEventos}
          description="Visitas e inspecciones programadas"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Observaciones Pendientes"
          value={stats.observacionesPendientes}
          description="Requieren accion correctiva"
          icon={Eye}
          variant={stats.observacionesPendientes > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Cumplimiento"
          value={`${stats.cumplimiento}%`}
          description="Puntaje promedio de checklists"
          icon={BarChart3}
          variant={stats.cumplimiento >= 80 ? "success" : stats.cumplimiento >= 60 ? "warning" : "danger"}
        />
      </StatCardsGrid>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Acceso rapido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Ver Informes", description: "Descarga tus informes y protocolos", href: "/portal/informes", icon: FileText },
            { title: "Agenda", description: "Consulta visitas programadas", href: "/portal/agenda", icon: Calendar },
            { title: "Observaciones", description: "Estado de hallazgos y correcciones", href: "/portal/observaciones", icon: Eye },
            { title: "Estadisticas", description: "Metricas de cumplimiento", href: "/portal/estadisticas", icon: BarChart3 },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Este portal es de solo lectura. Para consultas o solicitar cambios, contacta a tu
          profesional de seguridad e higiene asignado.
        </p>
      </div>
    </div>
  )
}

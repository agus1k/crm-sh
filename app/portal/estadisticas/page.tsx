"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { StatCard, StatCardsGrid } from "@/components/portal/stat-cards"
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Loader2,
  PieChart,
} from "lucide-react"
import { isPast } from "date-fns"

interface ComplianceStats {
  // Reports
  totalReports: number
  completedReports: number
  // Checklists
  totalChecklists: number
  avgChecklistScore: number
  // Observations
  totalObservations: number
  resolvedObservations: number
  overdueObservations: number
  resolutionRate: number
  // Protocols
  totalProtocols: number
  compliantProtocols: number
  // Risk
  totalAssessments: number
  // Incidents
  totalIncidents: number
}

export default function PortalEstadisticasPage() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!profile?.organization_id) { setLoading(false); return }

      const supabase = createClient()

      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("organization_id", profile.organization_id)
      const clientIds = clients?.map((c) => c.id) || []
      if (clientIds.length === 0) { setLoading(false); return }

      const [
        reportsRes,
        completedReportsRes,
        checklistsRes,
        observationsRes,
        resolvedObsRes,
        allOpenObsRes,
        protocolsRes,
        compliantProtocolsRes,
        riskRes,
        incidentRes,
      ] = await Promise.all([
        // Total reports
        supabase.from("reports").select("id", { count: "exact", head: true }).in("client_id", clientIds),
        // Completed reports
        supabase.from("reports").select("id", { count: "exact", head: true }).in("client_id", clientIds).in("status", ["completado", "enviado"]),
        // Checklists with scores
        supabase.from("checklists").select("score_total").in("client_id", clientIds).eq("status", "completado"),
        // Total observations
        supabase.from("observations").select("id", { count: "exact", head: true }).in("client_id", clientIds),
        // Resolved observations
        supabase.from("observations").select("id", { count: "exact", head: true }).in("client_id", clientIds).in("status", ["resuelta", "cerrada"]),
        // Open observations (for overdue check)
        supabase.from("observations").select("fecha_limite, status").in("client_id", clientIds).in("status", ["abierta", "en_proceso"]),
        // Total protocols
        supabase.from("measurement_protocols").select("id", { count: "exact", head: true }).in("client_id", clientIds),
        // Compliant protocols
        supabase.from("measurement_protocols").select("id", { count: "exact", head: true }).in("client_id", clientIds).in("status", ["completado", "firmado"]),
        // Risk assessments
        supabase.from("risk_assessments").select("id", { count: "exact", head: true }).in("client_id", clientIds),
        // Incidents
        supabase.from("incidents").select("id", { count: "exact", head: true }).in("client_id", clientIds),
      ])

      // Calculate checklist average score
      const scores = checklistsRes.data
        ?.map((c) => c.score_total)
        .filter((s): s is number => s !== null) ?? []
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

      // Count overdue observations
      const overdueCount = (allOpenObsRes.data || []).filter(
        (o) => o.fecha_limite && isPast(new Date(o.fecha_limite))
      ).length

      const totalObs = observationsRes.count ?? 0
      const resolvedObs = resolvedObsRes.count ?? 0
      const resolutionRate = totalObs > 0 ? Math.round((resolvedObs / totalObs) * 100) : 0

      setStats({
        totalReports: reportsRes.count ?? 0,
        completedReports: completedReportsRes.count ?? 0,
        totalChecklists: scores.length,
        avgChecklistScore: avgScore,
        totalObservations: totalObs,
        resolvedObservations: resolvedObs,
        overdueObservations: overdueCount,
        resolutionRate,
        totalProtocols: protocolsRes.count ?? 0,
        compliantProtocols: compliantProtocolsRes.count ?? 0,
        totalAssessments: riskRes.count ?? 0,
        totalIncidents: incidentRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [profile?.organization_id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PieChart className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">Sin datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estadisticas de Cumplimiento</h1>
        <p className="text-muted-foreground mt-1">
          Metricas generales de seguridad e higiene de tu empresa
        </p>
      </div>

      {/* Main KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Indicadores Principales</h2>
        <StatCardsGrid>
          <StatCard
            title="Tasa de Resolucion"
            value={`${stats.resolutionRate}%`}
            description={`${stats.resolvedObservations} de ${stats.totalObservations} observaciones`}
            icon={TrendingUp}
            variant={stats.resolutionRate >= 80 ? "success" : stats.resolutionRate >= 50 ? "warning" : "danger"}
          />
          <StatCard
            title="Cumplimiento Checklists"
            value={`${stats.avgChecklistScore}%`}
            description={`Promedio de ${stats.totalChecklists} checklists`}
            icon={CheckCircle2}
            variant={stats.avgChecklistScore >= 80 ? "success" : stats.avgChecklistScore >= 60 ? "warning" : "danger"}
          />
          <StatCard
            title="Observaciones Vencidas"
            value={stats.overdueObservations}
            description="Requieren atencion urgente"
            icon={AlertTriangle}
            variant={stats.overdueObservations === 0 ? "success" : "danger"}
          />
          <StatCard
            title="Informes Completados"
            value={stats.completedReports}
            description={`De ${stats.totalReports} totales`}
            icon={FileText}
            variant="default"
          />
        </StatCardsGrid>
      </div>

      {/* Detailed breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Detalle por Area</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Observations breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-medium text-foreground mb-3">Observaciones</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">{stats.totalObservations}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resueltas</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.resolvedObservations}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vencidas</span>
                <span className={`font-medium ${stats.overdueObservations > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                  {stats.overdueObservations}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${stats.resolutionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.resolutionRate}% resuelto</p>
              </div>
            </div>
          </div>

          {/* Protocols breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-medium text-foreground mb-3">Protocolos y Mediciones</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total protocolos</span>
                <span className="font-medium text-foreground">{stats.totalProtocols}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completados/Firmados</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.compliantProtocols}</span>
              </div>
              {stats.totalProtocols > 0 && (
                <div className="mt-2">
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round((stats.compliantProtocols / stats.totalProtocols) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.compliantProtocols / stats.totalProtocols) * 100)}% completado
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Risk & Incidents */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-medium text-foreground mb-3">Riesgos e Incidentes</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Evaluaciones de riesgo</span>
                <span className="font-medium text-foreground">{stats.totalAssessments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Incidentes registrados</span>
                <span className={`font-medium ${stats.totalIncidents > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {stats.totalIncidents}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Checklists completados</span>
                <span className="font-medium text-foreground">{stats.totalChecklists}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Las estadisticas se actualizan en tiempo real. Para informacion mas detallada o
          consultas sobre los resultados, contacta a tu profesional de seguridad e higiene.
        </p>
      </div>
    </div>
  )
}

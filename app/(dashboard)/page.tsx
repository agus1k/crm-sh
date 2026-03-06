"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import {
  Building2, FileText, Calendar, TrendingUp, Clock, Plus,
  Wrench, GraduationCap, Eye, ClipboardCheck, ShieldAlert,
  AlertTriangle, Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { REPORT_STATUSES, EVENT_TYPES } from "@/lib/crm-types"
import type { Report, CalendarEvent } from "@/lib/crm-types"
import { calcularIndices } from "@/lib/incidentes/indices"
import { format, formatDistanceToNow, differenceInCalendarDays, subMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts"

// ---------- Types for new widgets ----------

interface ObservationSummary {
  status: string
  count: number
}

interface ComplianceData {
  avgScore: number
  totalCompleted: number
}

interface ExpirationItem {
  type: "calibration" | "credential"
  name: string
  fecha_vencimiento: string
  daysRemaining: number
}

interface MonthlyIncidentData {
  month: string
  indiceFrecuencia: number
  indiceGravedad: number
}

interface ActivityItem {
  type: "visit" | "checklist" | "risk_assessment" | "incident" | "observation"
  description: string
  date: string
}

// ---------- Constants ----------

const OBS_COLORS: Record<string, string> = {
  abierta: "#3b82f6",
  en_proceso: "#eab308",
  resuelta: "#22c55e",
  cerrada: "#6b7280",
  vencida: "#ef4444",
}

const OBS_LABELS: Record<string, string> = {
  abierta: "Abierta",
  en_proceso: "En Proceso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
  vencida: "Vencida",
}

const ACTIVITY_ICONS: Record<string, typeof Eye> = {
  visit: Eye,
  checklist: ClipboardCheck,
  risk_assessment: ShieldAlert,
  incident: AlertTriangle,
  observation: Activity,
}

const ACTIVITY_LABELS: Record<string, string> = {
  visit: "Visita",
  checklist: "Checklist",
  risk_assessment: "Relevamiento de riesgos",
  incident: "Incidente",
  observation: "Observación",
}

// ---------- Component ----------

export default function DashboardPage() {
  const { profile, organization } = useAuthStore()
  const [stats, setStats] = useState({ totalClients: 0, activeReports: 0, upcomingEvents: 0, completedReports: 0 })
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // New widget state
  const [observationsSummary, setObservationsSummary] = useState<ObservationSummary[] | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [expirations, setExpirations] = useState<ExpirationItem[] | null>(null)
  const [siniestralidad, setSiniestralidad] = useState<MonthlyIncidentData[] | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityItem[] | null>(null)

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const loadDashboard = async () => {
      // ---- Existing queries ----
      const [clientsRes, reportsRes, eventsRes, completedRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_active", true),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["borrador", "enviado"]),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_completed", false).gte("event_date", new Date().toISOString()),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "completado"),
      ])
      setStats({
        totalClients: clientsRes.count || 0, activeReports: reportsRes.count || 0,
        upcomingEvents: eventsRes.count || 0, completedReports: completedRes.count || 0,
      })

      const { data: reports } = await supabase.from("reports").select("*, project:projects(name, client:clients(razon_social))").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5)
      setRecentReports((reports as Report[]) || [])

      const { data: events } = await supabase.from("events").select("*, client:clients(razon_social)").eq("organization_id", orgId).eq("is_completed", false).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(5)
      setUpcomingEvents((events as CalendarEvent[]) || [])

      // ---- New widget queries (all in parallel) ----
      const now = new Date()
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const nowISO = now.toISOString()
      const twelveMonthsAgo = startOfMonth(subMonths(now, 11)).toISOString()

      const [
        obsRes,
        checklistRes,
        calibrationsRes,
        credentialsRes,
        incidentsRes,
        feedVisits,
        feedChecklists,
        feedRiskAssessments,
        feedIncidents,
        feedObservations,
      ] = await Promise.all([
        // 1. Observations by status
        supabase.from("observations").select("status").eq("organization_id", orgId),
        // 2. Checklists completed with score
        supabase.from("checklists").select("score_total").eq("organization_id", orgId).eq("status", "completado").not("score_total", "is", null),
        // 3. Calibrations expiring in 30 days
        supabase.from("instrument_calibrations").select("fecha_vencimiento, instrument:instruments(nombre)").eq("organization_id", orgId).gte("fecha_vencimiento", nowISO).lte("fecha_vencimiento", in30Days).order("fecha_vencimiento", { ascending: true }),
        // 4. Professional credentials expiring in 30 days
        supabase.from("professional_credentials").select("fecha_vencimiento, profile:profiles(full_name)").eq("organization_id", orgId).gte("fecha_vencimiento", nowISO).lte("fecha_vencimiento", in30Days).order("fecha_vencimiento", { ascending: true }),
        // 5. Incidents last 12 months
        supabase.from("incidents").select("fecha, tipo, dias_perdidos").eq("organization_id", orgId).gte("fecha", twelveMonthsAgo).order("fecha", { ascending: true }),
        // 6-10. Activity feed (5 parallel queries, each limit 5)
        supabase.from("visits").select("id, fecha, motivo, client:clients(razon_social)").eq("organization_id", orgId).order("fecha", { ascending: false }).limit(5),
        supabase.from("checklists").select("id, created_at, template:checklist_templates(nombre), client:clients(razon_social)").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
        supabase.from("risk_assessments").select("id, created_at, titulo, client:clients(razon_social)").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
        supabase.from("incidents").select("id, fecha, tipo, descripcion, client:clients(razon_social)").eq("organization_id", orgId).order("fecha", { ascending: false }).limit(5),
        supabase.from("observations").select("id, created_at, titulo, client:clients(razon_social)").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
      ])

      // -- Process Observations Summary --
      try {
        if (obsRes.data) {
          const counts: Record<string, number> = {}
          for (const row of obsRes.data) {
            counts[row.status] = (counts[row.status] || 0) + 1
          }
          const summary: ObservationSummary[] = Object.entries(counts).map(([status, count]) => ({ status, count }))
          setObservationsSummary(summary.length > 0 ? summary : [])
        } else {
          setObservationsSummary([])
        }
      } catch {
        setObservationsSummary(null)
      }

      // -- Process Compliance Data --
      try {
        if (checklistRes.data && checklistRes.data.length > 0) {
          const scores = checklistRes.data.map((c: any) => c.score_total as number)
          const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          setComplianceData({ avgScore: Math.round(avg * 10) / 10, totalCompleted: scores.length })
        } else {
          setComplianceData({ avgScore: 0, totalCompleted: 0 })
        }
      } catch {
        setComplianceData(null)
      }

      // -- Process Expirations --
      try {
        const items: ExpirationItem[] = []
        if (calibrationsRes.data) {
          for (const cal of calibrationsRes.data as any[]) {
            items.push({
              type: "calibration",
              name: cal.instrument?.nombre || "Instrumento",
              fecha_vencimiento: cal.fecha_vencimiento,
              daysRemaining: differenceInCalendarDays(new Date(cal.fecha_vencimiento), now),
            })
          }
        }
        if (credentialsRes.data) {
          for (const cred of credentialsRes.data as any[]) {
            items.push({
              type: "credential",
              name: cred.profile?.full_name || "Profesional",
              fecha_vencimiento: cred.fecha_vencimiento,
              daysRemaining: differenceInCalendarDays(new Date(cred.fecha_vencimiento), now),
            })
          }
        }
        items.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())
        setExpirations(items)
      } catch {
        setExpirations(null)
      }

      // -- Process Sinistrality --
      try {
        if (incidentsRes.data) {
          const trabajadores = 10
          const horasTrabajadas = 200 * trabajadores
          // Build monthly map for last 12 months
          const monthlyMap = new Map<string, { accidentes: number; diasPerdidos: number }>()
          for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i)
            const key = format(startOfMonth(d), "yyyy-MM")
            monthlyMap.set(key, { accidentes: 0, diasPerdidos: 0 })
          }
          for (const inc of incidentsRes.data as any[]) {
            const key = inc.fecha.substring(0, 7) // yyyy-MM
            const entry = monthlyMap.get(key)
            if (entry) {
              if (inc.tipo === "accidente") entry.accidentes++
              entry.diasPerdidos += inc.dias_perdidos || 0
            }
          }
          const chartData: MonthlyIncidentData[] = []
          for (const [key, val] of Array.from(monthlyMap)) {
            const indices = calcularIndices(val.accidentes, val.diasPerdidos, horasTrabajadas, trabajadores)
            const d = new Date(key + "-01")
            chartData.push({
              month: format(d, "MMM yy", { locale: es }),
              indiceFrecuencia: Math.round(indices.indiceFrecuencia * 100) / 100,
              indiceGravedad: Math.round(indices.indiceGravedad * 100) / 100,
            })
          }
          setSiniestralidad(chartData)
        } else {
          setSiniestralidad([])
        }
      } catch {
        setSiniestralidad(null)
      }

      // -- Process Activity Feed --
      try {
        const allItems: ActivityItem[] = []
        if (feedVisits.data) {
          for (const v of feedVisits.data as any[]) {
            allItems.push({ type: "visit", description: `${v.motivo || "Visita"} - ${v.client?.razon_social || ""}`, date: v.fecha })
          }
        }
        if (feedChecklists.data) {
          for (const c of feedChecklists.data as any[]) {
            allItems.push({ type: "checklist", description: `${c.template?.nombre || "Checklist"} - ${c.client?.razon_social || ""}`, date: c.created_at })
          }
        }
        if (feedRiskAssessments.data) {
          for (const r of feedRiskAssessments.data as any[]) {
            allItems.push({ type: "risk_assessment", description: `${r.titulo || "Relevamiento"} - ${r.client?.razon_social || ""}`, date: r.created_at })
          }
        }
        if (feedIncidents.data) {
          for (const inc of feedIncidents.data as any[]) {
            allItems.push({ type: "incident", description: `${inc.descripcion?.substring(0, 60) || "Incidente"} - ${inc.client?.razon_social || ""}`, date: inc.fecha })
          }
        }
        if (feedObservations.data) {
          for (const o of feedObservations.data as any[]) {
            allItems.push({ type: "observation", description: `${o.titulo || "Observación"} - ${o.client?.razon_social || ""}`, date: o.created_at })
          }
        }
        allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setActivityFeed(allItems.slice(0, 15))
      } catch {
        setActivityFeed(null)
      }

      setLoading(false)
    }
    loadDashboard()
  }, [profile?.organization_id])

  // ---------- Helpers ----------

  const overdueCount = observationsSummary?.find(o => o.status === "vencida")?.count || 0

  function getComplianceColor(score: number): string {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  function getComplianceTextColor(score: number): string {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  function getDaysRemainingBadge(days: number): string {
    if (days < 7) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    if (days < 15) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  }

  // ---------- Stat cards ----------

  const statCards = [
    { title: "Clientes activos", value: stats.totalClients, icon: Building2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { title: "Informes pendientes", value: stats.activeReports, icon: FileText, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { title: "Próximos eventos", value: stats.upcomingEvents, icon: Calendar, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { title: "Informes completados", value: stats.completedReports, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  ]

  return (
    <>
      <Topbar title={`Hola, ${profile?.full_name || "Usuario"}`} description={organization?.name || ""} />
      <div className="p-4 lg:p-6 space-y-6">
        {/* ===== Existing stat cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.title} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <div className={`p-2.5 rounded-lg ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{loading ? "-" : card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Existing reports + events ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Informes recientes</h2>
              <Link href="/informes"><Button variant="ghost" size="sm" className="text-xs h-8">Ver todos</Button></Link>
            </div>
            <div className="divide-y divide-border">
              {loading ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</div> : recentReports.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay informes aún</p>
                  <Link href="/informes"><Button size="sm" variant="outline" className="mt-3 text-xs"><Plus className="h-3 w-3 mr-1" />Crear informe</Button></Link>
                </div>
              ) : recentReports.map((report) => (
                <Link key={report.id} href={`/informes/${report.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{(report as any).project?.client?.razon_social || "Sin cliente"}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${REPORT_STATUSES[report.status].color}`}>{REPORT_STATUSES[report.status].label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Próximos eventos</h2>
              <Link href="/agenda"><Button variant="ghost" size="sm" className="text-xs h-8">Ver agenda</Button></Link>
            </div>
            <div className="divide-y divide-border">
              {loading ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</div> : upcomingEvents.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
                  <Link href="/agenda"><Button size="sm" variant="outline" className="mt-3 text-xs"><Plus className="h-3 w-3 mr-1" />Crear evento</Button></Link>
                </div>
              ) : upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5"><Clock className="h-3 w-3 text-muted-foreground" /><p className="text-xs text-muted-foreground">{new Date(event.event_date).toLocaleDateString("es-AR")}</p></div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${EVENT_TYPES[event.event_type].color}`}>{EVENT_TYPES[event.event_type].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== NEW WIDGETS ===== */}

        {/* Row 1: Observations Pie + Compliance Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget 1: Observations Summary Pie Chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Resumen de Observaciones</h2>
              {overdueCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {overdueCount} vencida{overdueCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            ) : observationsSummary === null ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No disponible</div>
            ) : observationsSummary.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sin observaciones registradas</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={observationsSummary.map(o => ({ name: OBS_LABELS[o.status] || o.status, value: o.count, status: o.status }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {observationsSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={OBS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Widget 2: Compliance Gauge */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Cumplimiento General</h2>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            ) : complianceData === null ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No disponible</div>
            ) : complianceData.totalCompleted === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sin checklists completados</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] gap-4">
                <p className={`text-5xl font-bold ${getComplianceTextColor(complianceData.avgScore)}`}>
                  {complianceData.avgScore}%
                </p>
                <div className="w-full max-w-xs">
                  <Progress
                    value={complianceData.avgScore}
                    className="h-4"
                    style={{
                      // Override indicator color via CSS variable
                      ["--progress-color" as string]: complianceData.avgScore >= 80 ? "#22c55e" : complianceData.avgScore >= 60 ? "#eab308" : "#ef4444",
                    }}
                  />
                  {/* Overlay the color since shadcn Progress uses bg-primary */}
                  <style>{`
                    [style*="--progress-color"] > [data-state] {
                      background-color: var(--progress-color) !important;
                    }
                  `}</style>
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio de {complianceData.totalCompleted} checklist{complianceData.totalCompleted !== 1 ? "s" : ""} completado{complianceData.totalCompleted !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Expirations + Sinistrality Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget 3: Upcoming Expirations */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Próximos Vencimientos</h2>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : expirations === null ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No disponible</div>
            ) : expirations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Sin vencimientos próximos</div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {expirations.map((item, idx) => {
                  const Icon = item.type === "calibration" ? Wrench : GraduationCap
                  return (
                    <div key={`${item.type}-${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-1.5 rounded-md bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.fecha_vencimiento), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${getDaysRemainingBadge(item.daysRemaining)}`}>
                        {item.daysRemaining} día{item.daysRemaining !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Widget 4: Sinistrality Trend */}
          <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-foreground mb-4">Tendencia de Siniestralidad (12 meses)</h2>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            ) : siniestralidad === null ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No disponible</div>
            ) : siniestralidad.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Sin datos de incidentes</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={siniestralidad} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="indiceFrecuencia"
                    name="Índ. Frecuencia"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="indiceGravedad"
                    name="Índ. Gravedad"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 3: Activity Feed */}
        <div className="grid grid-cols-1">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Actividad Reciente</h2>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : activityFeed === null ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No disponible</div>
            ) : activityFeed.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Sin actividad reciente</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {activityFeed.map((item, idx) => {
                  const Icon = ACTIVITY_ICONS[item.type] || Activity
                  const label = ACTIVITY_LABELS[item.type] || item.type
                  let relativeTime = ""
                  try {
                    relativeTime = formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: es })
                  } catch {
                    relativeTime = ""
                  }
                  return (
                    <div key={`activity-${idx}`} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{label}</span>
                          {relativeTime && <span className="text-[10px] text-muted-foreground">{relativeTime}</span>}
                        </div>
                        <p className="text-sm text-foreground mt-0.5 truncate">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

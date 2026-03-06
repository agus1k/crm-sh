"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShieldAlert,
  Plus,
  Filter,
  Loader2,
  Building2,
  Calendar,
  Clock,
  Eye,
  AlertCircle,
  Search,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Incident, Client } from "@/lib/crm-types"
import {
  INCIDENT_TIPOS,
  INCIDENT_GRAVEDADES,
  INCIDENT_GRAVEDAD_COLORS,
  INCIDENT_STATUSES,
} from "@/lib/crm-types"
import { IncidentForm } from "@/components/incidents/incident-form"

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  reportado: { label: "Reportado", icon: <AlertCircle className="h-3 w-3" />, variant: "destructive" },
  en_investigacion: { label: "En Investigacion", icon: <Search className="h-3 w-3" />, variant: "default" },
  cerrado: { label: "Cerrado", icon: <CheckCircle2 className="h-3 w-3" />, variant: "secondary" },
}

export default function IncidentesPage() {
  const router = useRouter()
  const { profile } = useAuthStore()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const [filterClient, setFilterClient] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [incidentsRes, clientsRes] = await Promise.all([
      supabase
        .from("incidents")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), sector:sectors(id, nombre)"
        )
        .eq("organization_id", orgId)
        .order("fecha", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
    ])

    setIncidents((incidentsRes.data || []) as Incident[])
    setClients((clientsRes.data || []) as Client[])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (filterClient !== "all" && i.client_id !== filterClient) return false
      if (filterTipo !== "all" && i.tipo !== filterTipo) return false
      if (filterGravedad !== "all" && i.gravedad !== filterGravedad) return false
      if (filterStatus !== "all" && i.status !== filterStatus) return false
      return true
    })
  }, [incidents, filterClient, filterTipo, filterGravedad, filterStatus])

  const hasActiveFilters =
    filterClient !== "all" ||
    filterTipo !== "all" ||
    filterGravedad !== "all" ||
    filterStatus !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterTipo("all")
    setFilterGravedad("all")
    setFilterStatus("all")
  }

  // Summary stats
  const stats = useMemo(() => {
    const total = incidents.length
    const reportados = incidents.filter((i) => i.status === "reportado").length
    const enInvestigacion = incidents.filter((i) => i.status === "en_investigacion").length
    const diasPerdidos = incidents.reduce((sum, i) => sum + (i.dias_perdidos || 0), 0)
    return { total, reportados, enInvestigacion, diasPerdidos }
  }, [incidents])

  return (
    <>
      <Topbar
        title="Incidentes"
        description="Registro e investigacion de accidentes e incidentes laborales"
      />
      <div className="p-4 lg:p-6 space-y-4">
        {/* Stats */}
        {!loading && incidents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.reportados}</p>
              <p className="text-xs text-muted-foreground">Reportados</p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.enInvestigacion}</p>
              <p className="text-xs text-muted-foreground">En investigacion</p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.diasPerdidos}</p>
              <p className="text-xs text-muted-foreground">Dias perdidos</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} incidente{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo incidente</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Filtros:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(INCIDENT_TIPOS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGravedad} onValueChange={setFilterGravedad}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Gravedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(INCIDENT_GRAVEDADES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(INCIDENT_STATUSES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando incidentes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay incidentes que coincidan con los filtros"
                : "No hay incidentes registrados"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Registrar primer incidente
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((incident) => {
              const statusConf = STATUS_CONFIG[incident.status] || STATUS_CONFIG.reportado
              const gravedadColor = incident.gravedad
                ? INCIDENT_GRAVEDAD_COLORS[incident.gravedad] || ""
                : ""
              return (
                <button
                  key={incident.id}
                  onClick={() => router.push(`/incidentes/${incident.id}`)}
                  className="w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer border-border hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {INCIDENT_TIPOS[incident.tipo] || incident.tipo}
                        </Badge>
                        {incident.gravedad && (
                          <Badge className={`text-xs ${gravedadColor}`}>
                            {INCIDENT_GRAVEDADES[incident.gravedad] || incident.gravedad}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={statusConf.variant} className="gap-1 shrink-0 text-xs">
                        {statusConf.icon}
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {incident.descripcion}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {incident.client && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {(incident.client as { razon_social: string }).razon_social}
                        </span>
                      )}
                      {incident.establishment && (
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          {(incident.establishment as { nombre: string }).nombre}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(incident.fecha), "dd MMM yyyy", { locale: es })}
                      </span>
                      {incident.hora && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {incident.hora.slice(0, 5)}
                        </span>
                      )}
                      {incident.dias_perdidos != null && incident.dias_perdidos > 0 && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {incident.dias_perdidos} dia{incident.dias_perdidos !== 1 ? "s" : ""} perdido{incident.dias_perdidos !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Eye className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <IncidentForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setCreateOpen(false)
          router.push(`/incidentes/${id}`)
        }}
      />
    </>
  )
}

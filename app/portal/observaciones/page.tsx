"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  OBSERVATION_STATUSES,
  OBSERVATION_PRIORITIES,
  OBSERVATION_SOURCE_TYPES,
} from "@/lib/crm-types"
import type { Observation } from "@/lib/crm-types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Search, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"

const statusColors: Record<string, string> = {
  abierta: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  en_proceso: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  resuelta: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  cerrada: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  vencida: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const priorityColors: Record<string, string> = {
  baja: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  media: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  critica: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const statusIcons: Record<string, typeof Eye> = {
  abierta: AlertTriangle,
  en_proceso: Clock,
  resuelta: CheckCircle2,
  cerrada: CheckCircle2,
  vencida: AlertTriangle,
}

export default function PortalObservacionesPage() {
  const { profile } = useAuthStore()
  const [observations, setObservations] = useState<Observation[]>([])
  const [filtered, setFiltered] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("pendientes")
  const [filterPriority, setFilterPriority] = useState<string>("todas")

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

      const { data } = await supabase
        .from("observations")
        .select("*, client:clients(razon_social), establishment:establishments(nombre)")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })

      setObservations((data as Observation[]) || [])
      setLoading(false)
    }
    load()
  }, [profile?.organization_id])

  useEffect(() => {
    let result = observations

    if (filterStatus === "pendientes") {
      result = result.filter((o) => ["abierta", "en_proceso"].includes(o.status))
    } else if (filterStatus !== "todas") {
      result = result.filter((o) => o.status === filterStatus)
    }

    if (filterPriority !== "todas") {
      result = result.filter((o) => o.prioridad === filterPriority)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.titulo.toLowerCase().includes(q) ||
          o.descripcion.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [search, filterStatus, filterPriority, observations])

  // Stats
  const totalAbiertas = observations.filter((o) => o.status === "abierta").length
  const totalEnProceso = observations.filter((o) => o.status === "en_proceso").length
  const totalResueltas = observations.filter((o) => ["resuelta", "cerrada"].includes(o.status)).length
  const totalVencidas = observations.filter((o) => {
    if (o.fecha_limite && ["abierta", "en_proceso"].includes(o.status)) {
      return isPast(new Date(o.fecha_limite))
    }
    return false
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Observaciones</h1>
        <p className="text-muted-foreground mt-1">
          Hallazgos, no conformidades y acciones correctivas
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalAbiertas}</p>
          <p className="text-xs text-muted-foreground">Abiertas</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalEnProceso}</p>
          <p className="text-xs text-muted-foreground">En Proceso</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalResueltas}</p>
          <p className="text-xs text-muted-foreground">Resueltas</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalVencidas}</p>
          <p className="text-xs text-muted-foreground">Vencidas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar observaciones..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendientes">Pendientes</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
            {Object.entries(OBSERVATION_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las prioridades</SelectItem>
            {Object.entries(OBSERVATION_PRIORITIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No hay observaciones</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus === "pendientes"
              ? "No hay observaciones pendientes de resolucion"
              : "No se encontraron observaciones con los filtros aplicados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((obs) => {
            const StatusIcon = statusIcons[obs.status] || Eye
            const isOverdue = obs.fecha_limite && ["abierta", "en_proceso"].includes(obs.status) && isPast(new Date(obs.fecha_limite))

            return (
              <div
                key={obs.id}
                className={`rounded-xl border bg-card p-4 shadow-sm ${
                  isOverdue ? "border-red-300 dark:border-red-800" : "border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-foreground truncate">{obs.titulo}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 ml-6">
                      {obs.descripcion}
                    </p>
                    <div className="flex items-center gap-3 mt-2 ml-6 flex-wrap">
                      <Badge variant="secondary" className={statusColors[obs.status] || ""}>
                        {OBSERVATION_STATUSES[obs.status]?.label || obs.status}
                      </Badge>
                      <Badge variant="secondary" className={priorityColors[obs.prioridad] || ""}>
                        {OBSERVATION_PRIORITIES[obs.prioridad]?.label || obs.prioridad}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {OBSERVATION_SOURCE_TYPES[obs.source_type]?.label || obs.source_type}
                      </span>
                      {(obs as any).client?.razon_social && (
                        <span className="text-xs text-muted-foreground">
                          {(obs as any).client.razon_social}
                        </span>
                      )}
                    </div>
                    {obs.fecha_limite && (
                      <div className={`flex items-center gap-1 mt-1.5 ml-6 text-xs ${
                        isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                      }`}>
                        <Clock className="h-3 w-3" />
                        Limite: {format(new Date(obs.fecha_limite), "dd/MM/yyyy", { locale: es })}
                        {isOverdue && " (vencida)"}
                      </div>
                    )}
                    {obs.resolucion_descripcion && (
                      <div className="mt-2 ml-6 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-sm text-emerald-700 dark:text-emerald-300">
                        <strong>Resolucion:</strong> {obs.resolucion_descripcion}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(obs.created_at), "dd/MM/yyyy", { locale: es })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

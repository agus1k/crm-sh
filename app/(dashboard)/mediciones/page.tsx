"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { ProtocolForm } from "@/components/protocols/protocol-form"
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
  Plus,
  Loader2,
  Gauge,
  Filter,
  Building2,
  MapPin,
  Calendar,
  Eye,
  Sun,
  Volume2,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { MeasurementProtocol, Client, ProtocolType } from "@/lib/crm-types"
import { PROTOCOL_TYPES, PROTOCOL_STATUSES } from "@/lib/crm-types"

const typeIcons: Record<ProtocolType, React.ComponentType<{ className?: string }>> = {
  iluminacion: Sun,
  ruido: Volume2,
  pat: Zap,
}

export default function MedicionesPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [protocols, setProtocols] = useState<MeasurementProtocol[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [protocolsRes, clientsRes] = await Promise.all([
      supabase
        .from("measurement_protocols")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), instrument:instruments(id, nombre, marca, modelo)"
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
    ])

    setProtocols((protocolsRes.data || []) as MeasurementProtocol[])
    setClients((clientsRes.data || []) as Client[])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return protocols.filter((p) => {
      if (filterClient !== "all" && p.client_id !== filterClient) return false
      if (filterType !== "all" && p.tipo !== filterType) return false
      if (filterStatus !== "all" && p.status !== filterStatus) return false
      return true
    })
  }, [protocols, filterClient, filterType, filterStatus])

  const hasActiveFilters =
    filterClient !== "all" || filterType !== "all" || filterStatus !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterType("all")
    setFilterStatus("all")
  }

  return (
    <>
      <Topbar
        title="Mediciones"
        description="Protocolos de medición de iluminación, ruido y puesta a tierra"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} protocolo{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo protocolo</span>
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

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(PROTOCOL_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(PROTOCOL_STATUSES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
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
            <span className="text-sm">Cargando protocolos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Gauge className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay protocolos que coincidan con los filtros"
                : "No hay protocolos de medición"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear primer protocolo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((protocol) => {
              const typeInfo = PROTOCOL_TYPES[protocol.tipo]
              const statusInfo = PROTOCOL_STATUSES[protocol.status]
              const TypeIcon = typeIcons[protocol.tipo]

              const complianceColor =
                protocol.porcentaje_cumplimiento != null
                  ? protocol.porcentaje_cumplimiento >= 80
                    ? "text-green-600 dark:text-green-400"
                    : protocol.porcentaje_cumplimiento >= 60
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  : ""

              return (
                <button
                  key={protocol.id}
                  onClick={() => router.push(`/mediciones/${protocol.id}`)}
                  className="w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer border-border hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <TypeIcon className="h-4 w-4 shrink-0" />
                          {typeInfo.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(protocol.fecha_medicion + "T12:00:00"),
                            "EEE d MMM yyyy",
                            { locale: es }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {protocol.porcentaje_cumplimiento != null && (
                          <span
                            className={cn(
                              "text-sm font-bold",
                              complianceColor
                            )}
                          >
                            {Math.round(protocol.porcentaje_cumplimiento)}%
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(protocol.client as any)?.razon_social && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {(protocol.client as any).razon_social}
                        </span>
                      )}
                      {(protocol.establishment as any)?.nombre && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {(protocol.establishment as any).nombre}
                        </span>
                      )}
                      {protocol.puntos_total > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {protocol.puntos_cumple}/{protocol.puntos_total} cumple
                        </span>
                      )}
                      {(protocol.instrument as any)?.nombre && (
                        <span className="text-[10px] text-muted-foreground">
                          Inst: {(protocol.instrument as any).nombre}
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

      {/* Create protocol dialog */}
      <ProtocolForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/mediciones/${id}`)}
      />
    </>
  )
}

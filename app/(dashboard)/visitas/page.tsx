"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { VisitForm } from "@/components/visits/visit-form"
import {
  Plus,
  Loader2,
  ClipboardCheck,
  Filter,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Client, Visit, VisitStatus } from "@/lib/crm-types"
import { VISIT_STATUSES } from "@/lib/crm-types"

export default function VisitasPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [visits, setVisits] = useState<Visit[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Dialog
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [visitsRes, clientsRes] = await Promise.all([
      supabase
        .from("visits")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), profesional:profiles!visits_profesional_id_fkey(id, full_name)"
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

    // Count observations for each visit
    const visitData = (visitsRes.data || []) as Visit[]
    if (visitData.length > 0) {
      const visitIds = visitData.map((v) => v.id)
      const { data: obsCounts } = await supabase
        .from("visit_observations")
        .select("visit_id")
        .in("visit_id", visitIds)

      // Count per visit
      const countMap: Record<string, number> = {}
      obsCounts?.forEach((o: any) => {
        countMap[o.visit_id] = (countMap[o.visit_id] || 0) + 1
      })
      visitData.forEach((v) => {
        v._count = { observations: countMap[v.id] || 0 }
      })
    }

    setVisits(visitData)
    setClients((clientsRes.data as Client[]) || [])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (filterClient !== "all" && v.client_id !== filterClient) return false
      if (filterStatus !== "all" && v.status !== filterStatus) return false
      return true
    })
  }, [visits, filterClient, filterStatus])

  const hasActiveFilters =
    filterClient !== "all" || filterStatus !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterStatus("all")
  }

  return (
    <>
      <Topbar
        title="Visitas"
        description="Constancias de visita e inspecciones"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} visita{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva visita</span>
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(VISIT_STATUSES).map(([k, v]) => (
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
            <span className="text-sm">Cargando visitas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay visitas que coincidan con los filtros"
                : "No hay visitas registradas"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Registrar primera visita
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((visit) => {
              const statusInfo = VISIT_STATUSES[visit.status]
              const obsCount = visit._count?.observations || 0

              return (
                <button
                  key={visit.id}
                  onClick={() => router.push(`/visitas/${visit.id}`)}
                  className="w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer border-border hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                          {visit.motivo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(visit.fecha + "T12:00:00"), "EEE d MMM yyyy", {
                            locale: es,
                          })}
                          {visit.hora_ingreso && (
                            <span>
                              &middot; {visit.hora_ingreso.slice(0, 5)}
                              {visit.hora_egreso &&
                                ` - ${visit.hora_egreso.slice(0, 5)}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(visit.client as any)?.razon_social && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {(visit.client as any).razon_social}
                        </span>
                      )}
                      {(visit.establishment as any)?.nombre && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {(visit.establishment as any).nombre}
                        </span>
                      )}
                      {obsCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" />
                          {obsCount} observacion{obsCount !== 1 ? "es" : ""}
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

      <VisitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={load}
      />
    </>
  )
}

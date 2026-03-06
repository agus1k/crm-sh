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
  AlertTriangle,
  Plus,
  Filter,
  Loader2,
  Building2,
  Calendar,
  User,
  Eye,
  ShieldCheck,
  FileEdit,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { RiskAssessment, Client } from "@/lib/crm-types"
import { RiskForm } from "@/components/risks/risk-form"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  completado: { label: "Completado", variant: "default" },
  firmado: { label: "Firmado", variant: "outline" },
}

export default function RiesgosPage() {
  const router = useRouter()
  const { profile } = useAuthStore()

  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const [filterClient, setFilterClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [assessmentsRes, clientsRes] = await Promise.all([
      supabase
        .from("risk_assessments")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), sector:sectors(id, nombre), profesional:profiles(id, full_name)"
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

    setAssessments((assessmentsRes.data || []) as RiskAssessment[])
    setClients((clientsRes.data || []) as Client[])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (filterClient !== "all" && a.client_id !== filterClient) return false
      if (filterStatus !== "all" && a.status !== filterStatus) return false
      return true
    })
  }, [assessments, filterClient, filterStatus])

  const hasActiveFilters = filterClient !== "all" || filterStatus !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterStatus("all")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "borrador":
        return <FileEdit className="h-3 w-3" />
      case "completado":
        return <CheckCircle2 className="h-3 w-3" />
      case "firmado":
        return <ShieldCheck className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <>
      <Topbar
        title="Evaluaciones de Riesgos"
        description="Matriz de riesgo por establecimiento y sector"
      />
      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} evaluaci{filtered.length === 1 ? "on" : "ones"}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva evaluacion</span>
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
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="firmado">Firmado</SelectItem>
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
            <span className="text-sm">Cargando evaluaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay evaluaciones que coincidan con los filtros"
                : "No hay evaluaciones de riesgos"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Crear primera evaluacion
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((assessment) => {
              const statusConf = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.borrador
              return (
                <button
                  key={assessment.id}
                  onClick={() => router.push(`/riesgos/${assessment.id}`)}
                  className="w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer border-border hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {assessment.titulo}
                      </h3>
                      <Badge variant={statusConf.variant} className="gap-1 shrink-0 text-xs">
                        {getStatusIcon(assessment.status)}
                        {statusConf.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {assessment.client && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {(assessment.client as { razon_social: string }).razon_social}
                        </span>
                      )}
                      {assessment.establishment && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {(assessment.establishment as { nombre: string }).nombre}
                        </span>
                      )}
                      {assessment.sector && (
                        <span className="text-muted-foreground/70">
                          / {(assessment.sector as { nombre: string }).nombre}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(assessment.fecha), "dd MMM yyyy", { locale: es })}
                      </span>
                      {assessment.profesional && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {(assessment.profesional as { full_name: string }).full_name}
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

      <RiskForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setCreateOpen(false)
          router.push(`/riesgos/${id}`)
        }}
      />
    </>
  )
}

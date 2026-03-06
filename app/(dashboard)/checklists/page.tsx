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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Loader2,
  ListChecks,
  Filter,
  Building2,
  MapPin,
  Calendar,
  Eye,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type {
  Checklist,
  ChecklistTemplate,
  Client,
  Establishment,
} from "@/lib/crm-types"
import { CHECKLIST_STATUSES } from "@/lib/crm-types"

export default function ChecklistsPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterTemplate, setFilterTemplate] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // New checklist dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newTemplateId, setNewTemplateId] = useState("")
  const [newClientId, setNewClientId] = useState("")
  const [newEstablishmentId, setNewEstablishmentId] = useState("")
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [checklistsRes, templatesRes, clientsRes, establishmentsRes] =
      await Promise.all([
        supabase
          .from("checklists")
          .select(
            "*, template:checklist_templates(id, nombre, categoria), client:clients(id, razon_social), establishment:establishments(id, nombre)"
          )
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        supabase
          .from("checklist_templates")
          .select("id, nombre, categoria, is_system")
          .order("nombre"),
        supabase
          .from("clients")
          .select("*")
          .eq("organization_id", orgId)
          .eq("is_active", true)
          .order("razon_social"),
        supabase
          .from("establishments")
          .select("*")
          .eq("organization_id", orgId)
          .eq("is_active", true)
          .order("nombre"),
      ])

    setChecklists((checklistsRes.data || []) as Checklist[])
    setTemplates((templatesRes.data || []) as ChecklistTemplate[])
    setClients((clientsRes.data || []) as Client[])
    setEstablishments((establishmentsRes.data || []) as Establishment[])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  // Filtered establishments for new checklist dialog
  const filteredEstablishments = useMemo(() => {
    if (!newClientId) return []
    return establishments.filter((e) => e.client_id === newClientId)
  }, [establishments, newClientId])

  const filtered = useMemo(() => {
    return checklists.filter((c) => {
      if (filterClient !== "all" && c.client_id !== filterClient) return false
      if (filterTemplate !== "all" && c.template_id !== filterTemplate)
        return false
      if (filterStatus !== "all" && c.status !== filterStatus) return false
      return true
    })
  }, [checklists, filterClient, filterTemplate, filterStatus])

  const hasActiveFilters =
    filterClient !== "all" ||
    filterTemplate !== "all" ||
    filterStatus !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterTemplate("all")
    setFilterStatus("all")
  }

  const handleCreate = async () => {
    if (
      !profile?.organization_id ||
      !newTemplateId ||
      !newClientId ||
      !newEstablishmentId
    )
      return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("checklists")
      .insert({
        organization_id: profile.organization_id,
        template_id: newTemplateId,
        client_id: newClientId,
        establishment_id: newEstablishmentId,
        profesional_id: profile.id,
        fecha: new Date().toISOString().split("T")[0],
        status: "en_proceso",
      })
      .select("id")
      .single()

    setCreating(false)
    if (error) {
      toast.error("Error al crear checklist")
      console.error(error)
      return
    }

    toast.success("Checklist creado")
    setCreateOpen(false)
    setNewTemplateId("")
    setNewClientId("")
    setNewEstablishmentId("")
    router.push(`/checklists/${data.id}`)
  }

  return (
    <>
      <Topbar
        title="Checklists"
        description="Inspecciones y verificaciones realizadas"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} checklist{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo checklist</span>
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

            <Select value={filterTemplate} onValueChange={setFilterTemplate}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="Plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las plantillas</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
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
                {Object.entries(CHECKLIST_STATUSES).map(([k, v]) => (
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
            <span className="text-sm">Cargando checklists...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay checklists que coincidan con los filtros"
                : "No hay checklists realizados"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear primer checklist
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((checklist) => {
              const statusInfo = CHECKLIST_STATUSES[checklist.status]
              const scoreColor =
                (checklist.score_total || 0) >= 80
                  ? "text-green-600 dark:text-green-400"
                  : (checklist.score_total || 0) >= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"

              return (
                <button
                  key={checklist.id}
                  onClick={() => router.push(`/checklists/${checklist.id}`)}
                  className="w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer border-border hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                          {(checklist.template as any)?.nombre ||
                            "Checklist"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(checklist.fecha + "T12:00:00"),
                            "EEE d MMM yyyy",
                            { locale: es }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {checklist.score_total != null && (
                          <span
                            className={cn(
                              "text-sm font-bold flex items-center gap-1",
                              scoreColor
                            )}
                          >
                            <BarChart3 className="h-3 w-3" />
                            {Math.round(checklist.score_total)}%
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(checklist.client as any)?.razon_social && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {(checklist.client as any).razon_social}
                        </span>
                      )}
                      {(checklist.establishment as any)?.nombre && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {(checklist.establishment as any).nombre}
                        </span>
                      )}
                      {checklist.items_total > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {checklist.items_cumple}/{checklist.items_total} cumple
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

      {/* Create checklist dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Checklist</DialogTitle>
            <DialogDescription>
              Seleccioná la plantilla, cliente y establecimiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Plantilla *</Label>
              <Select value={newTemplateId} onValueChange={setNewTemplateId}>
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                      {t.is_system ? " (Sistema)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select
                value={newClientId}
                onValueChange={(v) => {
                  setNewClientId(v)
                  setNewEstablishmentId("")
                }}
              >
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Establecimiento *</Label>
              <Select
                value={newEstablishmentId}
                onValueChange={setNewEstablishmentId}
                disabled={!newClientId}
              >
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue
                    placeholder={
                      !newClientId
                        ? "Seleccionar cliente primero"
                        : "Seleccionar establecimiento..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredEstablishments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newClientId && filteredEstablishments.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Este cliente no tiene establecimientos registrados
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={
                creating ||
                !newTemplateId ||
                !newClientId ||
                !newEstablishmentId
              }
            >
              {creating && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Crear y completar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

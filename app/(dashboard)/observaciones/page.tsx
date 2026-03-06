"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { ObservationList } from "@/components/observations/observation-list"
import { ObservationDetail } from "@/components/observations/observation-detail"
import { ObservationFilters } from "@/components/observations/observation-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Eye, AlertTriangle, Download, X, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type {
  Observation,
  Client,
  Profile,
  CentralObservationType,
  ObservationPriority,
} from "@/lib/crm-types"
import {
  OBSERVATION_STATUSES,
  OBSERVATION_TYPES,
  OBSERVATION_PRIORITIES,
  OBSERVATION_SOURCE_TYPES,
} from "@/lib/crm-types"

export default function ObservacionesPage() {
  const { profile } = useAuthStore()
  const [observations, setObservations] = useState<Observation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterSourceType, setFilterSourceType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")

  // Detail sheet
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createClientId, setCreateClientId] = useState("")
  const [createEstablishmentId, setCreateEstablishmentId] = useState("")
  const [createTitulo, setCreateTitulo] = useState("")
  const [createDescripcion, setCreateDescripcion] = useState("")
  const [createTipo, setCreateTipo] = useState<CentralObservationType | "">("")
  const [createPrioridad, setCreatePrioridad] = useState<ObservationPriority | "">("")
  const [createFechaLimite, setCreateFechaLimite] = useState("")
  const [creating, setCreating] = useState(false)
  const [establishments, setEstablishments] = useState<{ id: string; nombre: string; client_id: string }[]>([])

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    const orgId = profile.organization_id

    const [obsRes, clientsRes, membersRes, estRes] = await Promise.all([
      supabase
        .from("observations")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), responsable:profiles!observations_responsable_id_fkey(id, full_name)"
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
      supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", orgId)
        .order("full_name"),
      supabase
        .from("establishments")
        .select("id, nombre, client_id")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("nombre"),
    ])

    setObservations((obsRes.data || []) as Observation[])
    setClients((clientsRes.data || []) as Client[])
    setMembers((membersRes.data || []) as Profile[])
    setEstablishments((estRes.data || []) as { id: string; nombre: string; client_id: string }[])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return observations.filter((o) => {
      if (filterClient !== "all" && o.client_id !== filterClient) return false
      if (filterSourceType !== "all" && o.source_type !== filterSourceType)
        return false
      if (filterStatus !== "all" && o.status !== filterStatus) return false
      if (filterPriority !== "all" && o.prioridad !== filterPriority)
        return false
      return true
    })
  }, [observations, filterClient, filterSourceType, filterStatus, filterPriority])

  const hasActiveFilters =
    filterClient !== "all" ||
    filterSourceType !== "all" ||
    filterStatus !== "all" ||
    filterPriority !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterSourceType("all")
    setFilterStatus("all")
    setFilterPriority("all")
  }

  // Stats
  const stats = useMemo(() => {
    const total = observations.length
    const abiertas = observations.filter(
      (o) => o.status === "abierta"
    ).length
    const enProceso = observations.filter(
      (o) => o.status === "en_proceso"
    ).length
    const vencidas = observations.filter(
      (o) =>
        o.fecha_limite &&
        new Date(o.fecha_limite) < new Date() &&
        (o.status === "abierta" || o.status === "en_proceso")
    ).length
    const criticas = observations.filter(
      (o) =>
        o.prioridad === "critica" &&
        o.status !== "resuelta" &&
        o.status !== "cerrada"
    ).length

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const resueltasEsteMes = observations.filter(
      (o) =>
        o.status === "resuelta" &&
        o.fecha_resolucion &&
        new Date(o.fecha_resolucion) >= startOfMonth
    ).length

    return { total, abiertas, enProceso, vencidas, criticas, resueltasEsteMes }
  }, [observations])

  const pct = (value: number) => {
    if (stats.total === 0) return "0%"
    return `${Math.round((value / stats.total) * 100)}%`
  }

  const handleSelectObs = (obs: Observation) => {
    setSelectedObs(obs)
    setDetailOpen(true)
  }

  const handleUpdated = () => {
    setDetailOpen(false)
    setSelectedObs(null)
    load()
  }

  // --- Bulk selection handlers ---
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelectAllVisible = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(filtered.map((o) => o.id)))
      } else {
        setSelectedIds(new Set())
      }
    },
    [filtered]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBulkClose = useCallback(async () => {
    if (selectedIds.size === 0) return

    setBulkLoading(true)
    const supabase = createClient()
    const ids = Array.from(selectedIds)

    const { error } = await supabase
      .from("observations")
      .update({ status: "cerrada" })
      .in("id", ids)

    setBulkLoading(false)

    if (error) {
      toast.error(`Error al cerrar observaciones: ${error.message}`)
      return
    }

    toast.success(`${ids.length} observación${ids.length !== 1 ? "es" : ""} cerrada${ids.length !== 1 ? "s" : ""}`)
    setSelectedIds(new Set())
    load()
  }, [selectedIds, load])

  const handleBulkChangePriority = useCallback(
    async (newPriority: ObservationPriority) => {
      if (selectedIds.size === 0) return

      setBulkLoading(true)
      const supabase = createClient()
      const ids = Array.from(selectedIds)

      const { error } = await supabase
        .from("observations")
        .update({ prioridad: newPriority })
        .in("id", ids)

      setBulkLoading(false)

      if (error) {
        toast.error(`Error al cambiar prioridad: ${error.message}`)
        return
      }

      toast.success(
        `Prioridad cambiada a ${OBSERVATION_PRIORITIES[newPriority].label} en ${ids.length} observación${ids.length !== 1 ? "es" : ""}`
      )
      setSelectedIds(new Set())
      load()
    },
    [selectedIds, load]
  )

  // --- CSV Export ---
  const handleExportCsv = useCallback(() => {
    const headers = [
      "Titulo",
      "Descripcion",
      "Cliente",
      "Establecimiento",
      "Tipo",
      "Prioridad",
      "Estado",
      "Fuente",
      "Responsable",
      "Fecha Creacion",
      "Fecha Limite",
      "Fecha Resolucion",
    ]

    const escapeField = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const rows = filtered.map((obs) => [
      escapeField(obs.titulo),
      escapeField(obs.descripcion),
      escapeField((obs.client as any)?.razon_social || ""),
      escapeField((obs.establishment as any)?.nombre || ""),
      escapeField(
        OBSERVATION_TYPES[obs.tipo as keyof typeof OBSERVATION_TYPES]?.label ||
          obs.tipo
      ),
      escapeField(OBSERVATION_PRIORITIES[obs.prioridad]?.label || obs.prioridad),
      escapeField(OBSERVATION_STATUSES[obs.status]?.label || obs.status),
      escapeField(OBSERVATION_SOURCE_TYPES[obs.source_type]?.label || obs.source_type),
      escapeField((obs.responsable as any)?.full_name || ""),
      escapeField(
        obs.created_at
          ? format(new Date(obs.created_at), "dd/MM/yyyy HH:mm", { locale: es })
          : ""
      ),
      escapeField(
        obs.fecha_limite
          ? format(new Date(obs.fecha_limite), "dd/MM/yyyy", { locale: es })
          : ""
      ),
      escapeField(
        obs.fecha_resolucion
          ? format(new Date(obs.fecha_resolucion), "dd/MM/yyyy", { locale: es })
          : ""
      ),
    ])

    // BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF"
    const csvContent =
      BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `observaciones_${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`${filtered.length} observación${filtered.length !== 1 ? "es" : ""} exportada${filtered.length !== 1 ? "s" : ""}`)
  }, [filtered])

  // Filtered establishments for create dialog
  const createFilteredEstablishments = useMemo(() => {
    if (!createClientId) return []
    return establishments.filter((e) => e.client_id === createClientId)
  }, [establishments, createClientId])

  const resetCreateForm = () => {
    setCreateClientId("")
    setCreateEstablishmentId("")
    setCreateTitulo("")
    setCreateDescripcion("")
    setCreateTipo("")
    setCreatePrioridad("")
    setCreateFechaLimite("")
  }

  const handleCreate = async () => {
    if (
      !profile?.organization_id ||
      !createClientId ||
      !createTitulo.trim() ||
      !createDescripcion.trim() ||
      !createTipo ||
      !createPrioridad
    )
      return

    setCreating(true)
    const supabase = createClient()

    const { error } = await supabase.from("observations").insert({
      organization_id: profile.organization_id,
      client_id: createClientId,
      establishment_id: createEstablishmentId || null,
      source_type: "manual",
      source_id: null,
      titulo: createTitulo.trim(),
      descripcion: createDescripcion.trim(),
      tipo: createTipo,
      prioridad: createPrioridad,
      status: "abierta",
      fecha_limite: createFechaLimite || null,
      created_by: profile.id,
    })

    setCreating(false)

    if (error) {
      toast.error(`Error al crear la observación: ${error.message}`)
      console.error(error)
      return
    }

    toast.success("Observación creada")
    resetCreateForm()
    setCreateOpen(false)
    load()
  }

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id))
  const someVisibleSelected =
    filtered.length > 0 && filtered.some((o) => selectedIds.has(o.id))

  return (
    <>
      <Topbar
        title="Observaciones"
        description="Hub central de observaciones, no conformidades y hallazgos"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Stats summary */}
        {!loading && observations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.abiertas}
              </p>
              <p className="text-xs text-muted-foreground">Abiertas</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {pct(stats.abiertas)} del total
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.enProceso}
              </p>
              <p className="text-xs text-muted-foreground">En proceso</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {pct(stats.enProceso)} del total
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.vencidas}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                {stats.vencidas > 0 && <AlertTriangle className="h-3 w-3" />}
                Vencidas
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {pct(stats.vencidas)} del total
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.criticas}
              </p>
              <p className="text-xs text-muted-foreground">Críticas activas</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {pct(stats.criticas)} del total
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-card text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.resueltasEsteMes}
              </p>
              <p className="text-xs text-muted-foreground">Resueltas este mes</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {pct(stats.resueltasEsteMes)} del total
              </p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {filtered.length > 0 && (
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => handleSelectAllVisible(!!checked)}
                aria-label="Seleccionar todas las observaciones visibles"
              />
            )}
            <p className="text-sm text-muted-foreground">
              {filtered.length} observaci{filtered.length !== 1 ? "ones" : "ón"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva observación</span>
            </Button>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 px-4 py-2.5 flex-wrap">
            <span className="text-sm font-medium">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkClose}
                disabled={bulkLoading}
                className="h-7 text-xs"
              >
                {bulkLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Cerrar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkLoading}
                    className="h-7 text-xs gap-1"
                  >
                    Cambiar prioridad
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(OBSERVATION_PRIORITIES).map(([key, val]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() =>
                        handleBulkChangePriority(key as ObservationPriority)
                      }
                    >
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearSelection}
                disabled={bulkLoading}
                className="h-7 text-xs gap-1"
              >
                <X className="h-3 w-3" />
                Deseleccionar
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <ObservationFilters
          clients={clients}
          filterClient={filterClient}
          filterSourceType={filterSourceType}
          filterStatus={filterStatus}
          filterPriority={filterPriority}
          onFilterClientChange={setFilterClient}
          onFilterSourceTypeChange={setFilterSourceType}
          onFilterStatusChange={setFilterStatus}
          onFilterPriorityChange={setFilterPriority}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando observaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay observaciones que coincidan con los filtros"
                : "No hay observaciones registradas"}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear primera observación
              </Button>
            )}
          </div>
        ) : (
          <ObservationList
            observations={filtered}
            onSelect={handleSelectObs}
            selectable={true}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </div>

      {/* Detail sheet */}
      <ObservationDetail
        observation={selectedObs}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        members={members}
        onUpdated={handleUpdated}
      />

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) resetCreateForm()
          setCreateOpen(v)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Observación Manual</DialogTitle>
            <DialogDescription>
              Registrá una observación, no conformidad o hallazgo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client */}
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select
                value={createClientId}
                onValueChange={(v) => {
                  setCreateClientId(v)
                  setCreateEstablishmentId("")
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

            {/* Establishment */}
            <div>
              <Label className="text-xs">Establecimiento</Label>
              <Select
                value={createEstablishmentId}
                onValueChange={setCreateEstablishmentId}
                disabled={!createClientId}
              >
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue
                    placeholder={
                      !createClientId
                        ? "Seleccionar cliente primero"
                        : "Seleccionar establecimiento..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {createFilteredEstablishments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titulo */}
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                value={createTitulo}
                onChange={(e) => setCreateTitulo(e.target.value)}
                placeholder="Título breve de la observación"
                className="text-sm mt-1"
              />
            </div>

            {/* Descripcion */}
            <div>
              <Label className="text-xs">Descripción *</Label>
              <Textarea
                value={createDescripcion}
                onChange={(e) => setCreateDescripcion(e.target.value)}
                placeholder="Descripción detallada del hallazgo..."
                rows={3}
                className="text-sm mt-1"
              />
            </div>

            {/* Tipo + Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo *</Label>
                <Select
                  value={createTipo}
                  onValueChange={(v) =>
                    setCreateTipo(v as CentralObservationType)
                  }
                >
                  <SelectTrigger className="text-sm mt-1">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OBSERVATION_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="accion_correctiva">
                      Acción Correctiva
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridad *</Label>
                <Select
                  value={createPrioridad}
                  onValueChange={(v) =>
                    setCreatePrioridad(v as ObservationPriority)
                  }
                >
                  <SelectTrigger className="text-sm mt-1">
                    <SelectValue placeholder="Prioridad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OBSERVATION_PRIORITIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha limite */}
            <div>
              <Label className="text-xs">Fecha límite</Label>
              <Input
                type="date"
                value={createFechaLimite}
                onChange={(e) => setCreateFechaLimite(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCreateForm()
                setCreateOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={
                creating ||
                !createClientId ||
                !createTitulo.trim() ||
                !createDescripcion.trim() ||
                !createTipo ||
                !createPrioridad
              }
            >
              {creating && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Crear observación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

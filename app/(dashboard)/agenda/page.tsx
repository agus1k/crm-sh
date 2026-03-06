"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
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
import {
  CalendarView,
  type CalendarViewMode,
} from "@/components/agenda/calendar-view"
import { EventFormEnhanced } from "@/components/agenda/event-form-enhanced"
import { EventDetail } from "@/components/agenda/event-detail"
import {
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  List,
  LayoutGrid,
  Filter,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type {
  EnhancedCalendarEvent,
  EventType,
  EventStatus,
  Client,
} from "@/lib/crm-types"
import {
  EVENT_TYPES,
  EVENT_STATUSES,
} from "@/lib/crm-types"
import { toast } from "sonner"
import { format, isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type ViewMode = CalendarViewMode | "list"

export default function AgendaPage() {
  const { profile } = useAuthStore()
  const [events, setEvents] = useState<EnhancedCalendarEvent[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EnhancedCalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined)
  const [detailEvent, setDetailEvent] = useState<EnhancedCalendarEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    // Fetch a broad range of events (3 months surrounding current view)
    const rangeStart = subDays(startOfMonth(currentDate), 7)
    const rangeEnd = addDays(endOfMonth(currentDate), 7)

    const [eventsRes, clientRes] = await Promise.all([
      supabase
        .from("events")
        .select(
          "*, client:clients(id, razon_social), establishment:establishments(id, nombre), assignee:profiles!events_assigned_to_fkey(id, full_name)"
        )
        .eq("organization_id", orgId)
        .gte("event_date", rangeStart.toISOString())
        .lte("event_date", rangeEnd.toISOString())
        .order("event_date", { ascending: true }),
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
    ])

    setEvents((eventsRes.data as EnhancedCalendarEvent[]) || [])
    setClients((clientRes.data as Client[]) || [])
    setLoading(false)
  }, [profile?.organization_id, currentDate])

  useEffect(() => {
    load()
  }, [load])

  // Filtered events
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterClient !== "all" && e.client_id !== filterClient) return false
      if (filterType !== "all" && e.event_type !== filterType) return false
      if (filterStatus !== "all" && (e.status || "planificado") !== filterStatus)
        return false
      return true
    })
  }, [events, filterClient, filterType, filterStatus])

  // List view events (sorted)
  const listEvents = useMemo(() => {
    return [...filtered].sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  }, [filtered])

  const handleAddEvent = (date?: string) => {
    setEditingEvent(null)
    setDefaultDate(date)
    setFormOpen(true)
  }

  const handleEditEvent = (event: EnhancedCalendarEvent) => {
    setEditingEvent(event)
    setDefaultDate(undefined)
    setFormOpen(true)
  }

  const handleEventClick = (event: EnhancedCalendarEvent) => {
    setDetailEvent(event)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("events").delete().eq("id", id)
    if (error) {
      toast.error("Error al eliminar evento")
      return
    }
    toast.success("Evento eliminado")
    load()
  }

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
        title="Agenda"
        description="Cronograma de inspecciones y reuniones"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                viewMode === "month"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Mes
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                viewMode === "week"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Semana
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                viewMode === "list"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => handleAddEvent()}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo evento</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Filtros:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filterClient}
              onValueChange={setFilterClient}
            >
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

            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(EVENT_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(EVENT_STATUSES).map(([k, v]) => (
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
            <span className="text-sm">Cargando agenda...</span>
          </div>
        ) : viewMode === "list" ? (
          // List view
          listEvents.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay eventos para mostrar
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => handleAddEvent()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear evento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {listEvents.map((event) => {
                const date = new Date(event.event_date)
                const status = (event.status || "planificado") as EventStatus
                const statusInfo = EVENT_STATUSES[status]
                const typeInfo = EVENT_TYPES[event.event_type]
                const past =
                  isPast(date) && status !== "realizado" && status !== "cancelado"

                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={cn(
                      "w-full text-left bg-card border rounded-xl p-4 flex gap-4 transition-colors cursor-pointer",
                      status === "realizado" &&
                        "opacity-60 bg-muted/30 border-border",
                      status === "cancelado" &&
                        "opacity-40 bg-muted/20 border-border",
                      past &&
                        status === "planificado" &&
                        "border-destructive/50 bg-destructive/5",
                      status !== "realizado" &&
                        status !== "cancelado" &&
                        !past &&
                        "border-border hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <h3
                            className={cn(
                              "font-semibold text-sm",
                              status === "realizado"
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {event.title}
                          </h3>
                          <p
                            className={cn(
                              "text-xs mt-0.5 font-medium flex items-center gap-1.5",
                              past && status === "planificado"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {format(
                              date,
                              "EEE d MMM, HH:mm",
                              { locale: es }
                            )}
                            {past &&
                              status === "planificado" &&
                              " (Vencido)"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {(event.client as any)?.razon_social && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {(event.client as any).razon_social}
                          </span>
                        )}
                        {(event.assignee as any)?.full_name && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            {(event.assignee as any).full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          // Calendar view (month or week)
          <CalendarView
            events={filtered}
            currentDate={currentDate}
            viewMode={viewMode}
            onDateChange={setCurrentDate}
            onEventClick={handleEventClick}
            onAddEvent={(date) => handleAddEvent(date)}
          />
        )}

        {/* Legend */}
        {viewMode !== "list" && (
          <div className="flex flex-wrap gap-4 pt-2 text-[10px]">
            <div className="flex items-center gap-3">
              <span className="font-medium text-muted-foreground">Estados:</span>
              {Object.entries(EVENT_STATUSES).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      k === "planificado" && "bg-gray-400",
                      k === "en_proceso" && "bg-blue-500",
                      k === "realizado" && "bg-green-500",
                      k === "pendiente" && "bg-yellow-500",
                      k === "cancelado" && "bg-red-500"
                    )}
                  />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced event form */}
      <EventFormEnhanced
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        defaultDate={defaultDate}
        onSaved={load}
      />

      {/* Event detail sheet */}
      <EventDetail
        event={detailEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditEvent}
        onDelete={handleDelete}
        onStatusChange={load}
      />
    </>
  )
}

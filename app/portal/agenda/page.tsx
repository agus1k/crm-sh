"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { EVENT_TYPES, EVENT_STATUSES } from "@/lib/crm-types"
import type { EnhancedCalendarEvent } from "@/lib/crm-types"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, Clock, Loader2, CalendarX } from "lucide-react"
import { format, isAfter, isBefore, startOfDay, addMonths } from "date-fns"
import { es } from "date-fns/locale"

const statusColors: Record<string, string> = {
  planificado: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  en_proceso: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  realizado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  pendiente: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  cancelado: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
}

const typeIcons: Record<string, string> = {
  inspeccion: "bg-blue-500",
  vencimiento: "bg-red-500",
  reunion: "bg-purple-500",
  otro: "bg-zinc-500",
}

export default function PortalAgendaPage() {
  const { profile } = useAuthStore()
  const [events, setEvents] = useState<EnhancedCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("upcoming")

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

      // Fetch events for the next 6 months + past month
      const pastMonth = addMonths(new Date(), -1).toISOString().split("T")[0]
      const future6 = addMonths(new Date(), 6).toISOString().split("T")[0]

      const { data } = await supabase
        .from("events")
        .select("*, client:clients(razon_social), establishment:establishments(nombre)")
        .in("client_id", clientIds)
        .gte("event_date", pastMonth)
        .lte("event_date", future6)
        .order("event_date", { ascending: true })

      setEvents((data as EnhancedCalendarEvent[]) || [])
      setLoading(false)
    }
    load()
  }, [profile?.organization_id])

  const today = startOfDay(new Date())

  const filteredEvents = events.filter((e) => {
    const eventDate = new Date(e.event_date)
    if (filterStatus === "upcoming") {
      return isAfter(eventDate, today) || format(eventDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    }
    if (filterStatus === "past") {
      return isBefore(eventDate, today)
    }
    return true // "todos"
  })

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
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Visitas, inspecciones y eventos programados
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Proximos</SelectItem>
            <SelectItem value="past">Pasados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No hay eventos</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus === "upcoming"
              ? "No hay visitas o eventos programados proximamente"
              : "No se encontraron eventos en el periodo seleccionado"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const eventDate = event.event_date
            const isPast = isBefore(new Date(eventDate), today)

            return (
              <div
                key={event.id}
                className={`flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ${
                  isPast ? "opacity-60" : ""
                }`}
              >
                {/* Date badge */}
                <div className="flex-shrink-0 flex items-start">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-muted text-center">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {format(new Date(eventDate), "MMM", { locale: es })}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {format(new Date(eventDate), "dd")}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${typeIcons[event.event_type] || typeIcons.otro}`} />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {EVENT_TYPES[event.event_type]?.label || event.event_type}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(eventDate), "EEEE dd/MM/yyyy", { locale: es })}
                    </div>
                    {(event as any).client?.razon_social && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {(event as any).client.razon_social}
                      </div>
                    )}
                    {(event as any).establishment?.nombre && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {(event as any).establishment.nombre}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 flex items-start">
                  <Badge variant="secondary" className={statusColors[event.status] || ""}>
                    {EVENT_STATUSES[event.status]?.label || event.status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

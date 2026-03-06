"use client"

import { useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EnhancedCalendarEvent, EventStatus } from "@/lib/crm-types"
import { EVENT_TYPES, EVENT_STATUSES } from "@/lib/crm-types"

type CalendarViewMode = "month" | "week"

interface CalendarViewProps {
  events: EnhancedCalendarEvent[]
  currentDate: Date
  viewMode: CalendarViewMode
  onDateChange: (date: Date) => void
  onEventClick: (event: EnhancedCalendarEvent) => void
  onAddEvent: (date: string) => void
}

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

// Status indicator dot color
function statusDotColor(status: EventStatus | undefined): string {
  switch (status) {
    case "en_proceso":
      return "bg-blue-500"
    case "realizado":
      return "bg-green-500"
    case "pendiente":
      return "bg-yellow-500"
    case "cancelado":
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}

function EventPill({
  event,
  onClick,
}: {
  event: EnhancedCalendarEvent
  onClick: () => void
}) {
  const typeInfo = EVENT_TYPES[event.event_type]
  const status = (event.status || "planificado") as EventStatus

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate",
        "hover:opacity-80 transition-opacity cursor-pointer",
        typeInfo.color
      )}
      title={event.title}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full mr-1 shrink-0",
          statusDotColor(status)
        )}
      />
      {format(new Date(event.event_date), "HH:mm")} {event.title}
    </button>
  )
}

// Month View
function MonthView({
  events,
  currentDate,
  onEventClick,
  onAddEvent,
}: Omit<CalendarViewProps, "viewMode" | "onDateChange">) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const eventsByDay = useMemo(() => {
    const map: Record<string, EnhancedCalendarEvent[]> = {}
    for (const ev of events) {
      const key = format(new Date(ev.event_date), "yyyy-MM-dd")
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    // Sort each day's events by time
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
    }
    return map
  }, [events])

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-muted-foreground py-2 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd")
          const dayEvents = eventsByDay[key] || []
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const maxVisible = 3

          return (
            <div
              key={key}
              className={cn(
                "min-h-[80px] lg:min-h-[100px] border-b border-r border-border p-1 relative group cursor-pointer",
                !inMonth && "bg-muted/30",
                today && "bg-primary/5"
              )}
              onClick={() =>
                onAddEvent(format(day, "yyyy-MM-dd") + "T09:00")
              }
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={cn(
                    "text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full",
                    !inMonth && "text-muted-foreground/50",
                    today &&
                      "bg-primary text-primary-foreground font-bold",
                    inMonth && !today && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddEvent(format(day, "yyyy-MM-dd") + "T09:00")
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((ev) => (
                  <EventPill
                    key={ev.id}
                    event={ev}
                    onClick={() => onEventClick(ev)}
                  />
                ))}
                {dayEvents.length > maxVisible && (
                  <p className="text-[9px] text-muted-foreground pl-1">
                    +{dayEvents.length - maxVisible} mas
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View
function WeekView({
  events,
  currentDate,
  onEventClick,
  onAddEvent,
}: Omit<CalendarViewProps, "viewMode" | "onDateChange">) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const eventsByDay = useMemo(() => {
    const map: Record<string, EnhancedCalendarEvent[]> = {}
    for (const ev of events) {
      const key = format(new Date(ev.event_date), "yyyy-MM-dd")
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
    }
    return map
  }, [events])

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const dayEvents = eventsByDay[key] || []
          const today = isToday(day)

          return (
            <div
              key={key}
              className={cn(
                "min-h-[200px] border-r border-border last:border-r-0 group",
                today && "bg-primary/5"
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  "text-center py-2 border-b border-border",
                  today && "bg-primary/10"
                )}
              >
                <p className="text-[10px] text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: es })}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    today
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>

              {/* Events */}
              <div className="p-1 space-y-1">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className={cn(
                      "w-full text-left rounded-lg p-2 text-xs transition-colors cursor-pointer",
                      "hover:ring-1 hover:ring-primary/30",
                      EVENT_TYPES[ev.event_type].color
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          statusDotColor(
                            (ev.status || "planificado") as EventStatus
                          )
                        )}
                      />
                      <span className="font-medium truncate">
                        {format(new Date(ev.event_date), "HH:mm")}
                      </span>
                    </div>
                    <p className="truncate font-medium">{ev.title}</p>
                    {(ev.client as any)?.razon_social && (
                      <p className="truncate text-[10px] opacity-70 mt-0.5">
                        {(ev.client as any).razon_social}
                      </p>
                    )}
                  </button>
                ))}

                {/* Add button */}
                <button
                  onClick={() =>
                    onAddEvent(format(day, "yyyy-MM-dd") + "T09:00")
                  }
                  className="w-full text-center py-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3 w-3 mx-auto" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main exported component
export function CalendarView({
  events,
  currentDate,
  viewMode,
  onDateChange,
  onEventClick,
  onAddEvent,
}: CalendarViewProps) {
  const navigateBack = () => {
    onDateChange(
      viewMode === "month"
        ? subMonths(currentDate, 1)
        : subWeeks(currentDate, 1)
    )
  }

  const navigateForward = () => {
    onDateChange(
      viewMode === "month"
        ? addMonths(currentDate, 1)
        : addWeeks(currentDate, 1)
    )
  }

  const navigateToday = () => {
    onDateChange(new Date())
  }

  const headerLabel =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy", { locale: es })
      : `${format(
          startOfWeek(currentDate, { weekStartsOn: 1 }),
          "d MMM",
          { locale: es }
        )} - ${format(
          endOfWeek(currentDate, { weekStartsOn: 1 }),
          "d MMM yyyy",
          { locale: es }
        )}`

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={navigateToday}
          >
            Hoy
          </Button>
        </div>
        <h2 className="text-sm font-semibold text-foreground capitalize">
          {headerLabel}
        </h2>
      </div>

      {/* Calendar grid */}
      {viewMode === "month" ? (
        <MonthView
          events={events}
          currentDate={currentDate}
          onEventClick={onEventClick}
          onAddEvent={onAddEvent}
        />
      ) : (
        <WeekView
          events={events}
          currentDate={currentDate}
          onEventClick={onEventClick}
          onAddEvent={onAddEvent}
        />
      )}
    </div>
  )
}

export type { CalendarViewMode }

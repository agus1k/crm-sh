"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Building2,
  MapPin,
  User,
  Repeat,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  Pause,
  XCircle,
  RotateCcw,
  CalendarRange,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { EnhancedCalendarEvent, EventStatus } from "@/lib/crm-types"
import {
  EVENT_TYPES,
  EVENT_STATUSES,
  EVENT_RECURRENCES,
} from "@/lib/crm-types"

// State machine transitions
const STATUS_TRANSITIONS: Record<
  EventStatus,
  { target: EventStatus; label: string; icon: React.ElementType }[]
> = {
  planificado: [
    { target: "en_proceso", label: "Iniciar", icon: Play },
    { target: "cancelado", label: "Cancelar", icon: XCircle },
  ],
  en_proceso: [
    { target: "realizado", label: "Completar", icon: CheckCircle2 },
    { target: "pendiente", label: "Posponer", icon: Pause },
  ],
  pendiente: [
    { target: "en_proceso", label: "Retomar", icon: RotateCcw },
    { target: "cancelado", label: "Cancelar", icon: XCircle },
  ],
  realizado: [],
  cancelado: [],
}

interface EventDetailProps {
  event: EnhancedCalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (event: EnhancedCalendarEvent) => void
  onDelete: (id: string) => void
  onStatusChange: () => void
}

export function EventDetail({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
}: EventDetailProps) {
  const [transitioning, setTransitioning] = useState(false)

  if (!event) return null

  const status = (event.status || "planificado") as EventStatus
  const statusInfo = EVENT_STATUSES[status]
  const typeInfo = EVENT_TYPES[event.event_type]
  const transitions = STATUS_TRANSITIONS[status] || []
  const recurrenceLabel =
    event.recurrence && event.recurrence !== "none"
      ? EVENT_RECURRENCES[event.recurrence]?.label
      : null

  const handleTransition = async (target: EventStatus) => {
    setTransitioning(true)
    const supabase = createClient()

    // If transitioning to realizado, also set is_completed
    const update: Record<string, unknown> = { status: target }
    if (target === "realizado") update.is_completed = true
    if (target === "en_proceso") update.is_completed = false

    const { error } = await supabase
      .from("events")
      .update(update)
      .eq("id", event.id)

    if (error) {
      toast.error("Error al cambiar estado")
    } else {
      toast.success(`Estado cambiado a ${EVENT_STATUSES[target].label}`)
      onStatusChange()
    }
    setTransitioning(false)
  }

  const handleDelete = () => {
    onDelete(event.id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left pr-6">{event.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status + Type badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-xs ${statusInfo.color}`}
            >
              {statusInfo.label}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-xs ${typeInfo.color}`}
            >
              {typeInfo.label}
            </Badge>
          </div>

          {/* Status transitions */}
          {transitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <Button
                  key={t.target}
                  size="sm"
                  variant={
                    t.target === "cancelado" ? "destructive" : "default"
                  }
                  className="gap-1.5 text-xs"
                  disabled={transitioning}
                  onClick={() => handleTransition(t.target)}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </Button>
              ))}
            </div>
          )}

          <Separator />

          {/* Details list */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-foreground">
                  {format(
                    new Date(event.event_date),
                    "EEEE d 'de' MMMM yyyy, HH:mm",
                    { locale: es }
                  )}
                </p>
                {event.end_date && (
                  <p className="text-muted-foreground text-xs">
                    hasta{" "}
                    {format(
                      new Date(event.end_date),
                      "EEEE d 'de' MMMM yyyy, HH:mm",
                      { locale: es }
                    )}
                  </p>
                )}
              </div>
            </div>

            {recurrenceLabel && (
              <div className="flex items-center gap-3 text-sm">
                <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{recurrenceLabel}</span>
              </div>
            )}

            {(event.client as any)?.razon_social && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {(event.client as any).razon_social}
                </span>
              </div>
            )}

            {(event.establishment as any)?.nombre && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {(event.establishment as any).nombre}
                </span>
              </div>
            )}

            {(event.assignee as any)?.full_name && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {(event.assignee as any).full_name}
                </span>
              </div>
            )}

            {event.plan_task_id && (
              <div className="flex items-center gap-3 text-sm">
                <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Generado desde Plan Anual
                </span>
              </div>
            )}
          </div>

          {event.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Descripcion
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 flex-1"
              onClick={() => {
                onOpenChange(false)
                onEdit(event)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

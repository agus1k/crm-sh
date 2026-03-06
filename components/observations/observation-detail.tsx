"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Building2,
  MapPin,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Link2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type {
  Observation,
  CentralObservationStatus,
  Profile,
} from "@/lib/crm-types"
import {
  OBSERVATION_STATUSES,
  OBSERVATION_SOURCE_TYPES,
  OBSERVATION_PRIORITIES,
  OBSERVATION_TYPES,
} from "@/lib/crm-types"

// Status transition map
const STATUS_TRANSITIONS: Record<CentralObservationStatus, CentralObservationStatus[]> = {
  abierta: ["en_proceso"],
  en_proceso: ["resuelta"],
  resuelta: ["cerrada"],
  cerrada: [],
  vencida: ["en_proceso"],
}

interface ObservationDetailProps {
  observation: Observation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Profile[]
  onUpdated: () => void
}

export function ObservationDetail({
  observation,
  open,
  onOpenChange,
  members,
  onUpdated,
}: ObservationDetailProps) {
  const { profile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [resolucion, setResolucion] = useState("")
  const [responsableId, setResponsableId] = useState<string>("")
  const [fechaLimite, setFechaLimite] = useState("")

  if (!observation) return null

  const statusInfo = OBSERVATION_STATUSES[observation.status]
  const sourceInfo = OBSERVATION_SOURCE_TYPES[observation.source_type]
  const priorityInfo = OBSERVATION_PRIORITIES[observation.prioridad]
  const tipoInfo = OBSERVATION_TYPES[observation.tipo as keyof typeof OBSERVATION_TYPES]
  const transitions = STATUS_TRANSITIONS[observation.status] || []

  const isOverdue =
    observation.fecha_limite &&
    isPast(new Date(observation.fecha_limite)) &&
    (observation.status === "abierta" || observation.status === "en_proceso")

  const handleStatusChange = async (newStatus: CentralObservationStatus) => {
    if (!profile?.organization_id) return

    setSaving(true)
    const supabase = createClient()

    const updates: Record<string, any> = { status: newStatus }

    // If resolving, require resolution description
    if (newStatus === "resuelta") {
      if (!resolucion.trim()) {
        toast.error("Ingresá una descripción de la resolución")
        setSaving(false)
        return
      }
      updates.resolucion_descripcion = resolucion
      updates.fecha_resolucion = new Date().toISOString().split("T")[0]
    }

    const { error } = await supabase
      .from("observations")
      .update(updates)
      .eq("id", observation.id)

    setSaving(false)

    if (error) {
      toast.error("Error al actualizar el estado")
      console.error(error)
      return
    }

    toast.success(`Estado cambiado a ${OBSERVATION_STATUSES[newStatus].label}`)
    setResolucion("")
    onUpdated()
  }

  const handleAssignResponsable = async () => {
    if (!responsableId) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("observations")
      .update({
        responsable_id: responsableId === "none" ? null : responsableId,
      })
      .eq("id", observation.id)

    setSaving(false)

    if (error) {
      toast.error("Error al asignar responsable")
      return
    }

    toast.success("Responsable actualizado")
    setResponsableId("")
    onUpdated()
  }

  const handleSetDeadline = async () => {
    if (!fechaLimite) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("observations")
      .update({ fecha_limite: fechaLimite })
      .eq("id", observation.id)

    setSaving(false)

    if (error) {
      toast.error("Error al establecer fecha límite")
      return
    }

    toast.success("Fecha límite actualizada")
    setFechaLimite("")
    onUpdated()
  }

  // Navigate to source
  const getSourceUrl = () => {
    if (!observation.source_id) return null
    switch (observation.source_type) {
      case "visita":
        return `/visitas/${observation.source_id}`
      case "checklist":
        return `/checklists/${observation.source_id}`
      case "medicion":
        return `/mediciones/${observation.source_id}`
      case "riesgo":
        return `/riesgos/${observation.source_id}`
      case "incidente":
        return `/incidentes/${observation.source_id}`
      default:
        return null
    }
  }

  const getSourceLabel = () => {
    switch (observation.source_type) {
      case "visita":
        return "Ver visita"
      case "checklist":
        return "Ver checklist"
      case "medicion":
        return "Ver medición"
      case "riesgo":
        return "Ver evaluación de riesgo"
      case "incidente":
        return "Ver incidente"
      default:
        return "Ver origen"
    }
  }

  const sourceUrl = getSourceUrl()
  const sourceLabel = getSourceLabel()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left text-base line-clamp-2">
            {observation.titulo}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn("text-xs", sourceInfo.color)}
            >
              {sourceInfo.label}
            </Badge>
            {tipoInfo && (
              <Badge
                variant="secondary"
                className={cn("text-xs", tipoInfo.color)}
              >
                {tipoInfo.label}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn("text-xs", priorityInfo.color)}
            >
              {priorityInfo.label}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                isOverdue
                  ? OBSERVATION_STATUSES.vencida.color
                  : statusInfo.color
              )}
            >
              {isOverdue ? "Vencida" : statusInfo.label}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Descripción
            </Label>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {observation.descripcion}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            {(observation.client as any)?.razon_social && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{(observation.client as any).razon_social}</span>
              </div>
            )}
            {(observation.establishment as any)?.nombre && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{(observation.establishment as any).nombre}</span>
              </div>
            )}
            {(observation.responsable as any)?.full_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Responsable: {(observation.responsable as any).full_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                Creada:{" "}
                {format(new Date(observation.created_at), "d MMM yyyy HH:mm", {
                  locale: es,
                })}
              </span>
            </div>
            {observation.fecha_limite && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isOverdue
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                )}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Vence:{" "}
                  {format(new Date(observation.fecha_limite), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
                {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
              </div>
            )}
            {observation.fecha_resolucion && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Resuelta:{" "}
                  {format(
                    new Date(observation.fecha_resolucion),
                    "d MMM yyyy",
                    { locale: es }
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Source link */}
          {sourceUrl && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={sourceUrl}>
                <ExternalLink className="h-3.5 w-3.5" />
                {sourceLabel}
              </a>
            </Button>
          )}

          {/* Resolution description (if resolved) */}
          {observation.resolucion_descripcion && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Resolución
              </Label>
              <div className="mt-1 p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20 text-sm whitespace-pre-wrap">
                {observation.resolucion_descripcion}
              </div>
            </div>
          )}

          {/* --- Actions --- */}
          {observation.status !== "cerrada" && (
            <div className="space-y-4 pt-3 border-t">
              <h4 className="text-sm font-semibold">Acciones</h4>

              {/* Status transitions */}
              {transitions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Cambiar estado
                  </Label>

                  {/* Resolution description input (show before resolving) */}
                  {transitions.includes("resuelta") && (
                    <div className="space-y-1">
                      <Textarea
                        value={resolucion}
                        onChange={(e) => setResolucion(e.target.value)}
                        placeholder="Descripción de la resolución (requerido)..."
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {transitions.map((nextStatus) => {
                      const nextInfo = OBSERVATION_STATUSES[nextStatus]
                      return (
                        <Button
                          key={nextStatus}
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(nextStatus)}
                          disabled={saving}
                          className="gap-1"
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3 w-3" />
                          )}
                          {nextInfo.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Assign responsable */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Asignar responsable
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={responsableId}
                    onValueChange={setResponsableId}
                  >
                    <SelectTrigger className="text-sm h-8 flex-1">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={handleAssignResponsable}
                    disabled={saving || !responsableId}
                  >
                    Asignar
                  </Button>
                </div>
              </div>

              {/* Set deadline */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Fecha límite
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="text-sm h-8 flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={handleSetDeadline}
                    disabled={saving || !fechaLimite}
                  >
                    Establecer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

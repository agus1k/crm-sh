"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Building2,
  MapPin,
  Calendar,
  User,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { format, isPast } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Observation, ObservationSourceType } from "@/lib/crm-types"
import {
  OBSERVATION_STATUSES,
  OBSERVATION_SOURCE_TYPES,
  OBSERVATION_PRIORITIES,
  OBSERVATION_TYPES,
} from "@/lib/crm-types"

const SOURCE_ROUTES: Record<Exclude<ObservationSourceType, "manual">, string> = {
  visita: "/visitas",
  checklist: "/checklists",
  medicion: "/mediciones",
  riesgo: "/riesgos",
  incidente: "/incidentes",
}

interface ObservationListProps {
  observations: Observation[]
  onSelect: (observation: Observation) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  viewMode?: "list" | "timeline"
}

function groupByDate(observations: Observation[]): Map<string, Observation[]> {
  const groups = new Map<string, Observation[]>()
  for (const obs of observations) {
    const key = format(new Date(obs.created_at), "dd MMMM yyyy", { locale: es })
    const group = groups.get(key)
    if (group) {
      group.push(obs)
    } else {
      groups.set(key, [obs])
    }
  }
  return groups
}

export function ObservationList({
  observations,
  onSelect,
  selectable = false,
  selectedIds,
  onToggleSelect,
  viewMode = "list",
}: ObservationListProps) {
  const router = useRouter()

  const grouped = useMemo(() => {
    if (viewMode !== "timeline") return null
    return groupByDate(observations)
  }, [observations, viewMode])

  function handleSourceClick(
    e: React.MouseEvent,
    sourceType: ObservationSourceType,
    sourceId: string | null
  ) {
    if (sourceType === "manual" || !sourceId) return
    e.stopPropagation()
    const basePath = SOURCE_ROUTES[sourceType]
    router.push(`${basePath}/${sourceId}`)
  }

  function renderCard(obs: Observation) {
    const statusInfo = OBSERVATION_STATUSES[obs.status]
    const sourceInfo = OBSERVATION_SOURCE_TYPES[obs.source_type]
    const priorityInfo = OBSERVATION_PRIORITIES[obs.prioridad]
    const tipoInfo = OBSERVATION_TYPES[obs.tipo as keyof typeof OBSERVATION_TYPES]
    const isSelected = selectable && selectedIds?.has(obs.id)

    const isOverdue =
      obs.fecha_limite &&
      isPast(new Date(obs.fecha_limite)) &&
      (obs.status === "abierta" || obs.status === "en_proceso")

    const isSourceClickable = obs.source_type !== "manual" && obs.source_id

    return (
      <div
        key={obs.id}
        className={cn(
          "w-full text-left bg-card border rounded-xl p-4 transition-colors cursor-pointer hover:shadow-sm flex items-start gap-3",
          isOverdue
            ? "border-red-300 dark:border-red-800"
            : "border-border hover:border-primary/30",
          isSelected && "ring-2 ring-primary/30"
        )}
      >
        {selectable && (
          <div className="pt-0.5 shrink-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(obs.id)}
              aria-label={`Seleccionar ${obs.titulo}`}
            />
          </div>
        )}
        <button
          onClick={() => onSelect(obs)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                {obs.titulo}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {obs.descripcion}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  sourceInfo.color,
                  isSourceClickable && "cursor-pointer hover:opacity-80"
                )}
                onClick={
                  isSourceClickable
                    ? (e: React.MouseEvent) =>
                        handleSourceClick(e, obs.source_type, obs.source_id)
                    : undefined
                }
              >
                {sourceInfo.label}
              </Badge>
              {tipoInfo && (
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] px-1.5 py-0", tipoInfo.color)}
                >
                  {tipoInfo.label}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn("text-[10px] px-1.5 py-0", priorityInfo.color)}
              >
                {priorityInfo.label}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isOverdue
                    ? OBSERVATION_STATUSES.vencida.color
                    : statusInfo.color
                )}
              >
                {isOverdue ? "Vencida" : statusInfo.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {(obs.client as any)?.razon_social && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {(obs.client as any).razon_social}
              </span>
            )}
            {(obs.establishment as any)?.nombre && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {(obs.establishment as any).nombre}
              </span>
            )}
            {(obs.responsable as any)?.full_name && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="h-3 w-3" />
                {(obs.responsable as any).full_name}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(obs.created_at), "d MMM yyyy", { locale: es })}
            </span>
            {obs.fecha_limite && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isOverdue
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Clock className="h-3 w-3" />
                Vence:{" "}
                {format(new Date(obs.fecha_limite), "d MMM yyyy", {
                  locale: es,
                })}
                {isOverdue && (
                  <AlertTriangle className="h-3 w-3 ml-0.5" />
                )}
              </span>
            )}
          </div>
        </button>
      </div>
    )
  }

  if (viewMode === "timeline" && grouped) {
    return (
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([dateLabel, groupObs]) => (
          <div key={dateLabel}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
              {dateLabel}
            </h4>
            <div className="border-l-2 border-muted pl-4 ml-2 space-y-2">
              {groupObs.map((obs) => renderCard(obs))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {observations.map((obs) => renderCard(obs))}
    </div>
  )
}

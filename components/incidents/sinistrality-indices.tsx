"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Activity, TrendingDown, TrendingUp, Users, Clock } from "lucide-react"
import {
  calcularIndices,
  INDICE_INFO,
  type IndicesSiniestralidad,
} from "@/lib/incidentes/indices"
import type { Incident } from "@/lib/crm-types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SinistralityIndicesProps {
  incidents: Incident[]
}

type IndiceKey = keyof IndicesSiniestralidad

// Thresholds for color coding (reasonable values for Argentine SHT context)
const THRESHOLDS: Record<IndiceKey, { low: number; high: number }> = {
  indiceFrecuencia: { low: 20, high: 60 },
  indiceGravedad: { low: 0.5, high: 2 },
  indiceIncidencia: { low: 30, high: 80 },
  indiceDuracionMedia: { low: 5, high: 15 },
}

const INDICE_ICONS: Record<IndiceKey, React.ElementType> = {
  indiceFrecuencia: Activity,
  indiceGravedad: TrendingUp,
  indiceIncidencia: Users,
  indiceDuracionMedia: Clock,
}

function getColorClasses(key: IndiceKey, value: number): string {
  const t = THRESHOLDS[key]
  if (value === 0) return "text-muted-foreground"
  if (value <= t.low)
    return "text-green-600 dark:text-green-400"
  if (value <= t.high)
    return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function getBgClasses(key: IndiceKey, value: number): string {
  const t = THRESHOLDS[key]
  if (value === 0) return "bg-muted/40 dark:bg-muted/20 border-border"
  if (value <= t.low)
    return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50"
  if (value <= t.high)
    return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50"
  return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SinistralityIndices({ incidents }: SinistralityIndicesProps) {
  const [horasTrabajadas, setHorasTrabajadas] = useState<number>(0)
  const [trabajadores, setTrabajadores] = useState<number>(0)

  // Derive counts from incidents array
  const accidentes = useMemo(
    () => incidents.filter((i) => i.tipo === "accidente").length,
    [incidents]
  )

  const diasPerdidos = useMemo(
    () => incidents.reduce((sum, i) => sum + (i.dias_perdidos || 0), 0),
    [incidents]
  )

  // Calculate indices
  const indices = useMemo(
    () => calcularIndices(accidentes, diasPerdidos, horasTrabajadas, trabajadores),
    [accidentes, diasPerdidos, horasTrabajadas, trabajadores]
  )

  const indiceKeys: IndiceKey[] = [
    "indiceFrecuencia",
    "indiceGravedad",
    "indiceIncidencia",
    "indiceDuracionMedia",
  ]

  return (
    <div className="space-y-4">
      {/* Input fields for hours & workers */}
      <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-4 space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Datos de exposición
        </h4>
        <p className="text-xs text-muted-foreground">
          Ingrese las horas trabajadas y la cantidad de trabajadores expuestos
          para calcular los índices de siniestralidad del período.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Accidentes</Label>
            <Input
              type="number"
              value={accidentes}
              disabled
              className="text-sm bg-muted/50 dark:bg-muted/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Días perdidos</Label>
            <Input
              type="number"
              value={diasPerdidos}
              disabled
              className="text-sm bg-muted/50 dark:bg-muted/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Horas trabajadas</Label>
            <Input
              type="number"
              min={0}
              value={horasTrabajadas || ""}
              onChange={(e) =>
                setHorasTrabajadas(
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              placeholder="Ej: 200000"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trabajadores expuestos</Label>
            <Input
              type="number"
              min={0}
              value={trabajadores || ""}
              onChange={(e) =>
                setTrabajadores(
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              placeholder="Ej: 120"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Index cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indiceKeys.map((key) => {
          const info = INDICE_INFO[key]
          const value = indices[key]
          const Icon = INDICE_ICONS[key]

          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border p-4 space-y-2 transition-colors",
                getBgClasses(key, value)
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-2xl font-bold tracking-tight",
                    getColorClasses(key, value)
                  )}
                >
                  {info.abbreviation}
                </span>
                <Icon
                  className={cn(
                    "h-5 w-5",
                    getColorClasses(key, value)
                  )}
                />
              </div>

              <div
                className={cn(
                  "text-3xl font-extrabold tabular-nums",
                  getColorClasses(key, value)
                )}
              >
                {value.toFixed(2)}
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground/80">
                  {info.unit}
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {info.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>Bajo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span>Moderado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>Alto</span>
        </div>
      </div>
    </div>
  )
}

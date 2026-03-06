"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hazard } from "@/lib/crm-types"
import { RISK_CLASIFICACION_COLORS } from "@/lib/crm-types"
import { calcularRiesgo, calcularRiesgoTeorico } from "@/lib/riesgos/calculos"

interface RiskComparisonProps {
  hazard: Hazard
}

export function RiskComparison({ hazard }: RiskComparisonProps) {
  const actual = useMemo(
    () =>
      calcularRiesgo({
        indice_personas_expuestas:
          hazard.indice_personas_expuestas ?? undefined,
        indice_procedimientos: hazard.indice_procedimientos ?? undefined,
        indice_capacitacion: hazard.indice_capacitacion ?? undefined,
        indice_exposicion: hazard.indice_exposicion ?? undefined,
        indice_severidad: hazard.indice_severidad ?? undefined,
      }),
    [hazard]
  )

  const hasTeoricoData =
    hazard.indice_personas_expuestas_teorico !== null ||
    hazard.indice_procedimientos_teorico !== null ||
    hazard.indice_capacitacion_teorico !== null ||
    hazard.indice_exposicion_teorico !== null ||
    hazard.indice_severidad_teorico !== null

  const teorico = useMemo(() => {
    if (!hasTeoricoData) return null
    return calcularRiesgoTeorico({
      indice_personas_expuestas_teorico:
        hazard.indice_personas_expuestas_teorico ?? undefined,
      indice_procedimientos_teorico:
        hazard.indice_procedimientos_teorico ?? undefined,
      indice_capacitacion_teorico:
        hazard.indice_capacitacion_teorico ?? undefined,
      indice_exposicion_teorico:
        hazard.indice_exposicion_teorico ?? undefined,
      indice_severidad_teorico:
        hazard.indice_severidad_teorico ?? undefined,
    })
  }, [hazard, hasTeoricoData])

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="text-sm font-semibold mb-3">
        Comparación de Riesgo: {hazard.factor_riesgo}
      </h4>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Actual column */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Actual
          </h5>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Probabilidad</span>
              <span className="font-medium">
                {actual.probabilidad.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severidad</span>
              <span className="font-medium">{actual.severidad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nivel de Riesgo</span>
              <span className="font-medium">
                {actual.nivelRiesgo.toFixed(2)}
              </span>
            </div>
            <div className="pt-1">
              <Badge
                className={cn(
                  RISK_CLASIFICACION_COLORS[actual.clasificacion]
                )}
              >
                {actual.clasificacion}
              </Badge>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          {hasTeoricoData ? (
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          ) : (
            <div className="h-5 w-5" />
          )}
        </div>

        {/* Theoretical column */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Con Mejoras
          </h5>
          {teorico ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Probabilidad</span>
                <span className="font-medium">
                  {teorico.probabilidad.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Severidad</span>
                <span className="font-medium">{teorico.severidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Nivel de Riesgo
                </span>
                <span className="font-medium">
                  {teorico.nivelRiesgo.toFixed(2)}
                </span>
              </div>
              <div className="pt-1">
                <Badge
                  className={cn(
                    RISK_CLASIFICACION_COLORS[teorico.clasificacion]
                  )}
                >
                  {teorico.clasificacion}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              Sin evaluación teórica
            </p>
          )}
        </div>
      </div>

      {/* Improvement indicator */}
      {teorico && actual.nivelRiesgo > teorico.nivelRiesgo && (
        <div className="mt-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md px-3 py-2 text-center">
          Reducción estimada del nivel de riesgo:{" "}
          <strong>
            {(actual.nivelRiesgo - teorico.nivelRiesgo).toFixed(2)} puntos
          </strong>{" "}
          ({((1 - teorico.nivelRiesgo / actual.nivelRiesgo) * 100).toFixed(0)}%)
        </div>
      )}
    </div>
  )
}

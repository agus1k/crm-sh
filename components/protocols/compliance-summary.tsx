"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, BarChart3 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ProtocolType, MeasurementPoint } from "@/lib/crm-types"
import { calculateIlluminationCompliance } from "@/lib/protocolos/iluminacion"
import { calculateNoiseCompliance } from "@/lib/protocolos/ruido"
import { calculateGroundingCompliance } from "@/lib/protocolos/pat"

interface ComplianceSummaryProps {
  tipo: ProtocolType
  points: MeasurementPoint[]
}

export function ComplianceSummary({ tipo, points }: ComplianceSummaryProps) {
  if (points.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Agregá puntos de medición para ver el resumen</p>
      </div>
    )
  }

  const ilumSummary = tipo === "iluminacion" ? calculateIlluminationCompliance(points) : null
  const noiseSummary = tipo === "ruido" ? calculateNoiseCompliance(points) : null
  const groundSummary = tipo === "pat" ? calculateGroundingCompliance(points) : null
  const summary = ilumSummary ?? noiseSummary ?? groundSummary!

  const porcentajeColor =
    summary.porcentaje >= 80
      ? "text-green-600 dark:text-green-400"
      : summary.porcentaje >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400"

  const progressColor =
    summary.porcentaje >= 80
      ? "[&>div]:bg-green-500"
      : summary.porcentaje >= 60
        ? "[&>div]:bg-yellow-500"
        : "[&>div]:bg-red-500"

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Resumen de Cumplimiento
        </h3>
        <div className={cn("text-2xl font-bold", porcentajeColor)}>
          {summary.porcentaje}%
        </div>
      </div>

      <Progress value={summary.porcentaje} className={cn("h-2", progressColor)} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-2 rounded-md bg-muted/50">
          <p className="text-lg font-bold text-foreground">{summary.total}</p>
          <p className="text-[10px] text-muted-foreground">Total puntos</p>
        </div>
        <div className="text-center p-2 rounded-md bg-green-50 dark:bg-green-950/20">
          <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {summary.cumple}
          </p>
          <p className="text-[10px] text-muted-foreground">Cumple</p>
        </div>
        <div className="text-center p-2 rounded-md bg-red-50 dark:bg-red-950/20">
          <p className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4" />
            {summary.noCumple}
          </p>
          <p className="text-[10px] text-muted-foreground">No cumple</p>
        </div>
        <div className="text-center p-2 rounded-md bg-muted/50">
          <p className="text-lg font-bold text-muted-foreground flex items-center justify-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {summary.sinEvaluar}
          </p>
          <p className="text-[10px] text-muted-foreground">Sin evaluar</p>
        </div>
      </div>

      {/* General compliance indicator */}
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-md text-sm font-medium",
          summary.cumpleGeneral
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : summary.total > 0 && summary.sinEvaluar < summary.total
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "bg-muted text-muted-foreground"
        )}
      >
        {summary.cumpleGeneral ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Cumplimiento general: CUMPLE
          </>
        ) : summary.total > 0 && summary.sinEvaluar < summary.total ? (
          <>
            <XCircle className="h-4 w-4" />
            Cumplimiento general: NO CUMPLE
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Faltan puntos por evaluar
          </>
        )}
      </div>

      {/* Noise-specific: max dose */}
      {noiseSummary && noiseSummary.dosisMaxima != null && (
        <div className={cn(
          "text-xs p-2 rounded-md",
          noiseSummary.dosisMaxima < 1
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        )}>
          Dosis máxima registrada: <strong className="font-mono">{noiseSummary.dosisMaxima.toFixed(4)}</strong>
          {noiseSummary.dosisMaxima >= 1 && " (supera el límite de 1.0)"}
        </div>
      )}

      {/* Grounding-specific: max measured value */}
      {groundSummary && groundSummary.valorMaximoMedido != null && (
        <div className="text-xs p-2 rounded-md bg-muted/50 text-muted-foreground">
          Valor máximo medido: <strong className="font-mono">{groundSummary.valorMaximoMedido.toFixed(4)} ohm</strong>
        </div>
      )}
    </div>
  )
}

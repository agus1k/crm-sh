"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import type { Hazard, RiskClasificacion } from "@/lib/crm-types"
import { RISK_CLASIFICACION_COLORS } from "@/lib/crm-types"

interface RiskMatrixChartProps {
  hazards: Hazard[]
}

interface ChartPoint {
  x: number
  y: number
  factor_riesgo: string
  clasificacion: RiskClasificacion | null
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as ChartPoint
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{data.factor_riesgo}</p>
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>Prob: {data.x.toFixed(2)}</span>
        <span>Sev: {data.y}</span>
      </div>
      {data.clasificacion && (
        <span
          className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${RISK_CLASIFICACION_COLORS[data.clasificacion]}`}
        >
          {data.clasificacion}
        </span>
      )}
    </div>
  )
}

export function RiskMatrixChart({ hazards }: RiskMatrixChartProps) {
  const data: ChartPoint[] = hazards
    .filter((h) => h.probabilidad !== null && h.indice_severidad !== null)
    .map((h) => ({
      x: h.probabilidad!,
      y: h.indice_severidad!,
      factor_riesgo: h.factor_riesgo,
      clasificacion: h.clasificacion,
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground border rounded-lg bg-muted/20">
        No hay peligros con evaluación completa para graficar.
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

          {/* Background quadrants */}
          {/* Tolerable: low prob, low sev (bottom-left) */}
          <ReferenceArea
            x1={0}
            x2={2.5}
            y1={0}
            y2={2.5}
            fill="#22c55e"
            fillOpacity={0.08}
            strokeOpacity={0}
            label={{
              value: "Tolerable",
              position: "insideBottomLeft",
              className: "fill-green-600 dark:fill-green-400 text-[10px]",
            }}
          />
          {/* Moderado: mid range */}
          <ReferenceArea
            x1={2.5}
            x2={5}
            y1={0}
            y2={5}
            fill="#eab308"
            fillOpacity={0.08}
            strokeOpacity={0}
            label={{
              value: "Moderado",
              position: "insideBottomLeft",
              className:
                "fill-yellow-600 dark:fill-yellow-400 text-[10px]",
            }}
          />
          <ReferenceArea
            x1={0}
            x2={2.5}
            y1={2.5}
            y2={5}
            fill="#eab308"
            fillOpacity={0.08}
            strokeOpacity={0}
          />
          {/* Importante: upper-mid range */}
          <ReferenceArea
            x1={5}
            x2={7.5}
            y1={0}
            y2={7.5}
            fill="#f97316"
            fillOpacity={0.08}
            strokeOpacity={0}
            label={{
              value: "Importante",
              position: "insideBottomLeft",
              className:
                "fill-orange-600 dark:fill-orange-400 text-[10px]",
            }}
          />
          <ReferenceArea
            x1={0}
            x2={5}
            y1={5}
            y2={7.5}
            fill="#f97316"
            fillOpacity={0.08}
            strokeOpacity={0}
          />
          {/* Intolerable: high prob, high sev (top-right) */}
          <ReferenceArea
            x1={7.5}
            x2={10}
            y1={0}
            y2={10}
            fill="#ef4444"
            fillOpacity={0.08}
            strokeOpacity={0}
            label={{
              value: "Intolerable",
              position: "insideTopRight",
              className: "fill-red-600 dark:fill-red-400 text-[10px]",
            }}
          />
          <ReferenceArea
            x1={0}
            x2={7.5}
            y1={7.5}
            y2={10}
            fill="#ef4444"
            fillOpacity={0.08}
            strokeOpacity={0}
          />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 10]}
            name="Probabilidad"
            label={{
              value: "Probabilidad",
              position: "insideBottom",
              offset: -5,
              className: "fill-foreground text-xs",
            }}
            tick={{ className: "fill-muted-foreground text-xs" }}
            tickLine={{ className: "stroke-border" }}
            axisLine={{ className: "stroke-border" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 10]}
            name="Severidad"
            label={{
              value: "Severidad",
              angle: -90,
              position: "insideLeft",
              className: "fill-foreground text-xs",
            }}
            tick={{ className: "fill-muted-foreground text-xs" }}
            tickLine={{ className: "stroke-border" }}
            axisLine={{ className: "stroke-border" }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Scatter
            name="Peligros"
            data={data}
            fill="hsl(var(--primary))"
            fillOpacity={0.8}
            r={6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

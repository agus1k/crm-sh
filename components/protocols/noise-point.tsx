"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, CheckCircle2, XCircle, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  RUIDO_TIPOS,
  RUIDO_MEDICION_TIPOS,
  evaluateNoisePoint,
  calculateNoiseDose,
} from "@/lib/protocolos/ruido"
import type { MeasurementPoint, NormativaRuido, DBSector } from "@/lib/crm-types"

interface NoisePointProps {
  point: Partial<MeasurementPoint>
  index: number
  sectors: DBSector[]
  normativa: NormativaRuido[]
  editable: boolean
  onUpdate: (index: number, updates: Partial<MeasurementPoint>) => void
  onRemove: (index: number) => void
}

export function NoisePoint({
  point,
  index,
  sectors,
  normativa,
  editable,
  onUpdate,
  onRemove,
}: NoisePointProps) {
  const cumple = evaluateNoisePoint({
    ruido_valor_medido_dba: point.ruido_valor_medido_dba ?? null,
    ruido_limite_dba: point.ruido_limite_dba ?? null,
    ruido_dosis: point.ruido_dosis ?? null,
  })

  // Auto-calculate dose when values change
  const recalcDose = (
    medido: number | null,
    limite: number | null,
    tiempo: number | null
  ) => {
    if (medido != null && limite != null && tiempo != null && tiempo > 0) {
      const dose = calculateNoiseDose(tiempo, limite, medido)
      return dose
    }
    return null
  }

  const handleMedidoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const dose = recalcDose(num, point.ruido_limite_dba ?? null, point.ruido_tiempo_exposicion_hs ?? null)
    const c = evaluateNoisePoint({
      ruido_valor_medido_dba: num,
      ruido_limite_dba: point.ruido_limite_dba ?? null,
      ruido_dosis: dose,
    })
    onUpdate(index, { ruido_valor_medido_dba: num, ruido_dosis: dose, cumple: c })
  }

  const handleTiempoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const dose = recalcDose(point.ruido_valor_medido_dba ?? null, point.ruido_limite_dba ?? null, num)
    const c = evaluateNoisePoint({
      ruido_valor_medido_dba: point.ruido_valor_medido_dba ?? null,
      ruido_limite_dba: point.ruido_limite_dba ?? null,
      ruido_dosis: dose,
    })
    onUpdate(index, { ruido_tiempo_exposicion_hs: num, ruido_dosis: dose, cumple: c })
  }

  // Auto-suggest limit from normativa when exposure time changes
  const handleLimiteAutoSuggest = (duracion: number) => {
    let closest: NormativaRuido | undefined
    let minDiff = Infinity
    for (const n of normativa) {
      const diff = Math.abs(n.duracion_hs - duracion)
      if (diff < minDiff) {
        minDiff = diff
        closest = n
      }
    }
    return closest?.limite_dba ?? null
  }

  const handleTiempoWithSuggest = (val: string) => {
    const num = val ? parseFloat(val) : null
    let limite = point.ruido_limite_dba ?? null
    // Auto-suggest limit if not manually set
    if (num != null && num > 0 && limite == null) {
      limite = handleLimiteAutoSuggest(num)
    }
    const dose = recalcDose(point.ruido_valor_medido_dba ?? null, limite, num)
    const c = evaluateNoisePoint({
      ruido_valor_medido_dba: point.ruido_valor_medido_dba ?? null,
      ruido_limite_dba: limite,
      ruido_dosis: dose,
    })
    onUpdate(index, {
      ruido_tiempo_exposicion_hs: num,
      ruido_limite_dba: limite,
      ruido_dosis: dose,
      cumple: c,
    })
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3",
        cumple === true && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
        cumple === false && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
        cumple === null && "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Punto {index + 1}</span>
          {cumple === true && (
            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Cumple
            </Badge>
          )}
          {cumple === false && (
            <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <XCircle className="h-3 w-3 mr-0.5" /> No cumple
            </Badge>
          )}
          {point.ruido_dosis != null && (
            <span className={cn(
              "text-[10px] font-mono",
              point.ruido_dosis < 0.5 ? "text-green-600 dark:text-green-400" :
              point.ruido_dosis < 1.0 ? "text-yellow-600 dark:text-yellow-400" :
              "text-red-600 dark:text-red-400"
            )}>
              Dosis: {point.ruido_dosis.toFixed(4)}
            </span>
          )}
        </div>
        {editable && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(index)}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Point name */}
        <div>
          <Label className="text-[11px]">Nombre del punto *</Label>
          <Input
            value={point.punto_nombre || ""}
            onChange={(e) => onUpdate(index, { punto_nombre: e.target.value })}
            placeholder="Ej: Puesto torno CNC"
            className="text-sm mt-1 h-8"
            disabled={!editable}
          />
        </div>

        {/* Sector */}
        <div>
          <Label className="text-[11px]">Sector</Label>
          <Select
            value={point.sector_id || "none"}
            onValueChange={(v) => onUpdate(index, { sector_id: v === "none" ? null : v })}
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Sin sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin sector</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo ruido */}
        <div>
          <Label className="text-[11px]">Tipo de ruido</Label>
          <Select
            value={point.ruido_tipo_ruido || "none"}
            onValueChange={(v) =>
              onUpdate(index, { ruido_tipo_ruido: v === "none" ? null : (v as "continuo" | "intermitente" | "impulso") })
            }
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {RUIDO_TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo medicion */}
        <div>
          <Label className="text-[11px]">Tipo medición</Label>
          <Select
            value={point.ruido_tipo_medicion || "none"}
            onValueChange={(v) =>
              onUpdate(index, { ruido_tipo_medicion: v === "none" ? null : (v as "puntual" | "dosimetria") })
            }
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {RUIDO_MEDICION_TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor medido */}
        <div>
          <Label className="text-[11px]">Valor medido (dBA) *</Label>
          <Input
            type="number"
            value={point.ruido_valor_medido_dba ?? ""}
            onChange={(e) => handleMedidoChange(e.target.value)}
            placeholder="0"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
            step="0.1"
          />
        </div>

        {/* Tiempo exposicion */}
        <div>
          <Label className="text-[11px]">Tiempo exposición (hs) *</Label>
          <Input
            type="number"
            value={point.ruido_tiempo_exposicion_hs ?? ""}
            onChange={(e) => handleTiempoWithSuggest(e.target.value)}
            placeholder="8"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
            step="0.5"
          />
        </div>

        {/* Limite */}
        <div>
          <Label className="text-[11px]">Límite (dBA)</Label>
          <Input
            type="number"
            value={point.ruido_limite_dba ?? ""}
            onChange={(e) => {
              const num = e.target.value ? parseFloat(e.target.value) : null
              const dose = recalcDose(point.ruido_valor_medido_dba ?? null, num, point.ruido_tiempo_exposicion_hs ?? null)
              const c = evaluateNoisePoint({
                ruido_valor_medido_dba: point.ruido_valor_medido_dba ?? null,
                ruido_limite_dba: num,
                ruido_dosis: dose,
              })
              onUpdate(index, { ruido_limite_dba: num, ruido_dosis: dose, cumple: c })
            }}
            placeholder="Res. 295/03"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
            step="0.1"
          />
        </div>

        {/* Dosis (read-only, calculated) */}
        <div>
          <Label className="text-[11px]">Dosis calculada</Label>
          <Input
            value={point.ruido_dosis != null ? point.ruido_dosis.toFixed(4) : "—"}
            className={cn(
              "text-sm mt-1 h-8 font-mono",
              point.ruido_dosis != null && point.ruido_dosis >= 1 && "text-red-600 dark:text-red-400"
            )}
            disabled
          />
        </div>

        {/* Observacion */}
        <div className="sm:col-span-2">
          <Label className="text-[11px]">Observación</Label>
          <Textarea
            value={point.observacion || ""}
            onChange={(e) => onUpdate(index, { observacion: e.target.value })}
            placeholder="Notas adicionales..."
            rows={2}
            className="text-sm mt-1"
            disabled={!editable}
          />
        </div>
      </div>
    </div>
  )
}

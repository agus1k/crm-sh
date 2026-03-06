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
import { Trash2, CheckCircle2, XCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PAT_ELECTRODOS,
  PAT_TERRENOS,
  PAT_VALORES_MAXIMOS,
  PAT_VALOR_MAXIMO_DEFAULT,
  evaluateGroundingPoint,
} from "@/lib/protocolos/pat"
import type { MeasurementPoint, DBSector } from "@/lib/crm-types"

interface GroundingPointProps {
  point: Partial<MeasurementPoint>
  index: number
  sectors: DBSector[]
  editable: boolean
  onUpdate: (index: number, updates: Partial<MeasurementPoint>) => void
  onRemove: (index: number) => void
}

export function GroundingPoint({
  point,
  index,
  sectors,
  editable,
  onUpdate,
  onRemove,
}: GroundingPointProps) {
  const cumple = evaluateGroundingPoint({
    pat_valor_medido_ohm: point.pat_valor_medido_ohm ?? null,
    pat_valor_maximo_ohm: point.pat_valor_maximo_ohm ?? null,
  })

  const handleMedidoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const c = evaluateGroundingPoint({
      pat_valor_medido_ohm: num,
      pat_valor_maximo_ohm: point.pat_valor_maximo_ohm ?? null,
    })
    onUpdate(index, { pat_valor_medido_ohm: num, cumple: c })
  }

  const handleMaximoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const c = evaluateGroundingPoint({
      pat_valor_medido_ohm: point.pat_valor_medido_ohm ?? null,
      pat_valor_maximo_ohm: num,
    })
    onUpdate(index, { pat_valor_maximo_ohm: num, cumple: c })
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
          <Zap className="h-4 w-4 text-emerald-500" />
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
            placeholder="Ej: Tablero principal"
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

        {/* Tipo electrodo */}
        <div>
          <Label className="text-[11px]">Tipo electrodo</Label>
          <Select
            value={point.pat_tipo_electrodo || "none"}
            onValueChange={(v) => onUpdate(index, { pat_tipo_electrodo: v === "none" ? null : v })}
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PAT_ELECTRODOS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profundidad */}
        <div>
          <Label className="text-[11px]">Profundidad (m)</Label>
          <Input
            type="number"
            value={point.pat_profundidad_m ?? ""}
            onChange={(e) =>
              onUpdate(index, { pat_profundidad_m: e.target.value ? parseFloat(e.target.value) : null })
            }
            placeholder="0.00"
            step="0.1"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
          />
        </div>

        {/* Terreno */}
        <div>
          <Label className="text-[11px]">Terreno</Label>
          <Select
            value={point.pat_terreno || "none"}
            onValueChange={(v) => onUpdate(index, { pat_terreno: v === "none" ? null : v })}
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Tipo de suelo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PAT_TERRENOS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor maximo */}
        <div>
          <Label className="text-[11px]">Valor máximo (ohm) *</Label>
          <Select
            value={String(point.pat_valor_maximo_ohm ?? PAT_VALOR_MAXIMO_DEFAULT)}
            onValueChange={(v) => handleMaximoChange(v)}
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAT_VALORES_MAXIMOS.map((v) => (
                <SelectItem key={v.value} value={String(v.value)}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor medido */}
        <div>
          <Label className="text-[11px]">Valor medido (ohm) *</Label>
          <Input
            type="number"
            value={point.pat_valor_medido_ohm ?? ""}
            onChange={(e) => handleMedidoChange(e.target.value)}
            placeholder="0.0000"
            step="0.0001"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
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

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Plus, Trash2, CheckCircle2, XCircle, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ILUMINACION_FUENTES,
  ILUMINACION_TIPOS,
  evaluateIlluminationPoint,
} from "@/lib/protocolos/iluminacion"
import type {
  MeasurementPoint,
  NormativaIluminacion,
  DBSector,
} from "@/lib/crm-types"

interface IlluminationPointProps {
  point: Partial<MeasurementPoint>
  index: number
  sectors: DBSector[]
  normativa: NormativaIluminacion[]
  editable: boolean
  onUpdate: (index: number, updates: Partial<MeasurementPoint>) => void
  onRemove: (index: number) => void
}

export function IlluminationPoint({
  point,
  index,
  sectors,
  normativa,
  editable,
  onUpdate,
  onRemove,
}: IlluminationPointProps) {
  const cumple = evaluateIlluminationPoint({
    ilum_valor_medido_lux: point.ilum_valor_medido_lux ?? null,
    ilum_valor_minimo_lux: point.ilum_valor_minimo_lux ?? null,
  })

  // Auto-suggest min lux from normativa when tarea changes
  const handleTareaChange = (tarea: string) => {
    onUpdate(index, { ilum_tarea: tarea })

    // Try to find matching normativa entry
    if (tarea.length > 3) {
      const tareaLower = tarea.toLowerCase()
      const match = normativa.find(
        (n) =>
          n.tarea.toLowerCase().includes(tareaLower) ||
          tareaLower.includes(n.tarea.toLowerCase())
      )
      if (match) {
        onUpdate(index, {
          ilum_tarea: tarea,
          ilum_valor_minimo_lux: match.lux_minimo,
        })
      }
    }
  }

  // Auto-evaluate cumple
  const handleMedidoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const c = evaluateIlluminationPoint({
      ilum_valor_medido_lux: num,
      ilum_valor_minimo_lux: point.ilum_valor_minimo_lux ?? null,
    })
    onUpdate(index, { ilum_valor_medido_lux: num, cumple: c })
  }

  const handleMinimoChange = (val: string) => {
    const num = val ? parseFloat(val) : null
    const c = evaluateIlluminationPoint({
      ilum_valor_medido_lux: point.ilum_valor_medido_lux ?? null,
      ilum_valor_minimo_lux: num,
    })
    onUpdate(index, { ilum_valor_minimo_lux: num, cumple: c })
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
          <Sun className="h-4 w-4 text-yellow-500" />
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
            placeholder="Ej: Escritorio 1"
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

        {/* Tarea / visual task */}
        <div className="sm:col-span-2">
          <Label className="text-[11px]">Tarea visual</Label>
          <Input
            value={point.ilum_tarea || ""}
            onChange={(e) => handleTareaChange(e.target.value)}
            placeholder="Descripción de la tarea visual (auto-sugiere mínimo)"
            className="text-sm mt-1 h-8"
            disabled={!editable}
          />
        </div>

        {/* Tipo iluminacion */}
        <div>
          <Label className="text-[11px]">Tipo iluminación</Label>
          <Select
            value={point.ilum_tipo_iluminacion || "none"}
            onValueChange={(v) =>
              onUpdate(index, {
                ilum_tipo_iluminacion: v === "none" ? null : (v as "natural" | "artificial" | "mixta"),
              })
            }
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {ILUMINACION_TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo fuente */}
        <div>
          <Label className="text-[11px]">Tipo fuente</Label>
          <Select
            value={point.ilum_tipo_fuente || "none"}
            onValueChange={(v) => onUpdate(index, { ilum_tipo_fuente: v === "none" ? null : v })}
            disabled={!editable}
          >
            <SelectTrigger className="text-sm mt-1 h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {ILUMINACION_FUENTES.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor medido */}
        <div>
          <Label className="text-[11px]">Valor medido (lux) *</Label>
          <Input
            type="number"
            value={point.ilum_valor_medido_lux ?? ""}
            onChange={(e) => handleMedidoChange(e.target.value)}
            placeholder="0"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
          />
        </div>

        {/* Valor minimo */}
        <div>
          <Label className="text-[11px]">Valor mínimo requerido (lux) *</Label>
          <Input
            type="number"
            value={point.ilum_valor_minimo_lux ?? ""}
            onChange={(e) => handleMinimoChange(e.target.value)}
            placeholder="Dec. 351/79"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
          />
        </div>

        {/* Uniformity */}
        <div>
          <Label className="text-[11px]">Uniformidad (E_min/E_med)</Label>
          <Input
            type="number"
            value={point.ilum_uniformidad ?? ""}
            onChange={(e) =>
              onUpdate(index, {
                ilum_uniformidad: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            placeholder="0.00"
            step="0.01"
            className="text-sm mt-1 h-8"
            disabled={!editable}
            min={0}
            max={1}
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

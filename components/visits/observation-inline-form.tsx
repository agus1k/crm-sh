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
import { Plus, Trash2, AlertTriangle } from "lucide-react"
import type {
  ObservationType,
  ObservationPriority,
  DBSector,
} from "@/lib/crm-types"
import {
  OBSERVATION_TYPES,
  OBSERVATION_PRIORITIES,
} from "@/lib/crm-types"

export interface InlineObservation {
  id: string
  tipo: ObservationType
  descripcion: string
  sector_id: string | null
  prioridad: ObservationPriority
  foto_url: string | null
}

interface ObservationInlineFormProps {
  observations: InlineObservation[]
  sectors: DBSector[]
  onChange: (observations: InlineObservation[]) => void
}

function generateId() {
  return `obs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function ObservationInlineForm({
  observations,
  sectors,
  onChange,
}: ObservationInlineFormProps) {
  const addObservation = () => {
    onChange([
      ...observations,
      {
        id: generateId(),
        tipo: "observacion",
        descripcion: "",
        sector_id: null,
        prioridad: "media",
        foto_url: null,
      },
    ])
  }

  const removeObservation = (id: string) => {
    onChange(observations.filter((o) => o.id !== id))
  }

  const updateObservation = (
    id: string,
    field: keyof InlineObservation,
    value: string | null
  ) => {
    onChange(
      observations.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      )
    )
  }

  return (
    <div className="space-y-4">
      {observations.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay observaciones registradas
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Agregue hallazgos encontrados durante la visita
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map((obs, index) => (
            <div
              key={obs.id}
              className="border rounded-lg p-4 space-y-3 bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  {obs.tipo && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${OBSERVATION_TYPES[obs.tipo]?.color || ""}`}
                    >
                      {OBSERVATION_TYPES[obs.tipo]?.label}
                    </Badge>
                  )}
                  {obs.prioridad && obs.prioridad !== "media" && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${OBSERVATION_PRIORITIES[obs.prioridad]?.color || ""}`}
                    >
                      {OBSERVATION_PRIORITIES[obs.prioridad]?.label}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeObservation(obs.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={obs.tipo}
                    onValueChange={(v) =>
                      updateObservation(obs.id, "tipo", v)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OBSERVATION_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Prioridad</Label>
                  <Select
                    value={obs.prioridad}
                    onValueChange={(v) =>
                      updateObservation(obs.id, "prioridad", v)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OBSERVATION_PRIORITIES).map(
                        ([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Sector</Label>
                  <Select
                    value={obs.sector_id || "none"}
                    onValueChange={(v) =>
                      updateObservation(
                        obs.id,
                        "sector_id",
                        v === "none" ? null : v
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sin sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sector</SelectItem>
                      {sectors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción *</Label>
                <Textarea
                  value={obs.descripcion}
                  onChange={(e) =>
                    updateObservation(obs.id, "descripcion", e.target.value)
                  }
                  placeholder="Describa el hallazgo encontrado..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={addObservation}
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar observación
      </Button>
    </div>
  )
}

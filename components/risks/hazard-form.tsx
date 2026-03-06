"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type {
  Hazard,
  HazardCategoria,
  WorkPosition,
} from "@/lib/crm-types"
import {
  HAZARD_CATEGORIAS,
  RISK_CLASIFICACION_COLORS,
} from "@/lib/crm-types"
import {
  calcularRiesgo,
  calcularRiesgoTeorico,
  INDICE_LABELS,
} from "@/lib/riesgos/calculos"

interface HazardFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  assessmentId: string
  hazard?: Hazard | null
  workPositions: WorkPosition[]
  onSaved: () => void
}

type IndiceKey =
  | "indice_personas_expuestas"
  | "indice_procedimientos"
  | "indice_capacitacion"
  | "indice_exposicion"
  | "indice_severidad"

const INDICE_FIELDS: {
  key: IndiceKey
  labelKey: keyof typeof INDICE_LABELS
}[] = [
  { key: "indice_personas_expuestas", labelKey: "personas_expuestas" },
  { key: "indice_procedimientos", labelKey: "procedimientos" },
  { key: "indice_capacitacion", labelKey: "capacitacion" },
  { key: "indice_exposicion", labelKey: "exposicion" },
  { key: "indice_severidad", labelKey: "severidad" },
]

export function HazardForm({
  open,
  onOpenChange,
  assessmentId,
  hazard,
  workPositions,
  onSaved,
}: HazardFormProps) {
  const { profile } = useAuthStore()
  const isEditing = !!hazard

  const [saving, setSaving] = useState(false)
  const [showTeorico, setShowTeorico] = useState(false)

  // Form fields
  const [factorRiesgo, setFactorRiesgo] = useState("")
  const [categoria, setCategoria] = useState<HazardCategoria | "">("")
  const [workPositionId, setWorkPositionId] = useState("")
  const [fuente, setFuente] = useState("")
  const [efectoPosible, setEfectoPosible] = useState("")

  // Sub-indices
  const [indices, setIndices] = useState<Record<IndiceKey, number | null>>({
    indice_personas_expuestas: null,
    indice_procedimientos: null,
    indice_capacitacion: null,
    indice_exposicion: null,
    indice_severidad: null,
  })

  // Corrective measures
  const [medidaCorrectiva, setMedidaCorrectiva] = useState("")
  const [responsableMejora, setResponsableMejora] = useState("")
  const [fechaLimiteMejora, setFechaLimiteMejora] = useState("")

  // Theoretical indices
  const [indicesTeoricos, setIndicesTeoricos] = useState<
    Record<IndiceKey, number | null>
  >({
    indice_personas_expuestas: null,
    indice_procedimientos: null,
    indice_capacitacion: null,
    indice_exposicion: null,
    indice_severidad: null,
  })

  // Live calculation
  const riskCalc = useMemo(() => {
    const allFilled = Object.values(indices).every((v) => v !== null)
    if (!allFilled) return null
    return calcularRiesgo({
      indice_personas_expuestas: indices.indice_personas_expuestas!,
      indice_procedimientos: indices.indice_procedimientos!,
      indice_capacitacion: indices.indice_capacitacion!,
      indice_exposicion: indices.indice_exposicion!,
      indice_severidad: indices.indice_severidad!,
    })
  }, [indices])

  const riskCalcTeorico = useMemo(() => {
    const allFilled = Object.values(indicesTeoricos).every((v) => v !== null)
    if (!allFilled) return null
    return calcularRiesgoTeorico({
      indice_personas_expuestas_teorico:
        indicesTeoricos.indice_personas_expuestas!,
      indice_procedimientos_teorico: indicesTeoricos.indice_procedimientos!,
      indice_capacitacion_teorico: indicesTeoricos.indice_capacitacion!,
      indice_exposicion_teorico: indicesTeoricos.indice_exposicion!,
      indice_severidad_teorico: indicesTeoricos.indice_severidad!,
    })
  }, [indicesTeoricos])

  // Populate form when editing
  useEffect(() => {
    if (hazard && open) {
      setFactorRiesgo(hazard.factor_riesgo)
      setCategoria(hazard.categoria)
      setWorkPositionId(hazard.work_position_id || "")
      setFuente(hazard.fuente || "")
      setEfectoPosible(hazard.efecto_posible || "")
      setIndices({
        indice_personas_expuestas: hazard.indice_personas_expuestas,
        indice_procedimientos: hazard.indice_procedimientos,
        indice_capacitacion: hazard.indice_capacitacion,
        indice_exposicion: hazard.indice_exposicion,
        indice_severidad: hazard.indice_severidad,
      })
      setMedidaCorrectiva(hazard.medida_correctiva || "")
      setResponsableMejora(hazard.responsable_mejora || "")
      setFechaLimiteMejora(hazard.fecha_limite_mejora || "")

      const hasTeoricoData =
        hazard.indice_personas_expuestas_teorico !== null ||
        hazard.indice_procedimientos_teorico !== null ||
        hazard.indice_capacitacion_teorico !== null ||
        hazard.indice_exposicion_teorico !== null ||
        hazard.indice_severidad_teorico !== null

      setIndicesTeoricos({
        indice_personas_expuestas:
          hazard.indice_personas_expuestas_teorico,
        indice_procedimientos: hazard.indice_procedimientos_teorico,
        indice_capacitacion: hazard.indice_capacitacion_teorico,
        indice_exposicion: hazard.indice_exposicion_teorico,
        indice_severidad: hazard.indice_severidad_teorico,
      })
      setShowTeorico(hasTeoricoData)
    } else if (!hazard && open) {
      resetForm()
    }
  }, [hazard, open])

  const resetForm = () => {
    setFactorRiesgo("")
    setCategoria("")
    setWorkPositionId("")
    setFuente("")
    setEfectoPosible("")
    setIndices({
      indice_personas_expuestas: null,
      indice_procedimientos: null,
      indice_capacitacion: null,
      indice_exposicion: null,
      indice_severidad: null,
    })
    setMedidaCorrectiva("")
    setResponsableMejora("")
    setFechaLimiteMejora("")
    setIndicesTeoricos({
      indice_personas_expuestas: null,
      indice_procedimientos: null,
      indice_capacitacion: null,
      indice_exposicion: null,
      indice_severidad: null,
    })
    setShowTeorico(false)
  }

  const handleSubmit = async () => {
    if (!profile?.organization_id) return
    if (!factorRiesgo.trim() || !categoria) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Calculate actual risk
      const calc = calcularRiesgo({
        indice_personas_expuestas: indices.indice_personas_expuestas ?? undefined,
        indice_procedimientos: indices.indice_procedimientos ?? undefined,
        indice_capacitacion: indices.indice_capacitacion ?? undefined,
        indice_exposicion: indices.indice_exposicion ?? undefined,
        indice_severidad: indices.indice_severidad ?? undefined,
      })

      // Calculate theoretical risk if data exists
      const hasTeoricoData = Object.values(indicesTeoricos).some(
        (v) => v !== null
      )
      let calcTeorico: ReturnType<typeof calcularRiesgoTeorico> | null = null
      if (hasTeoricoData) {
        calcTeorico = calcularRiesgoTeorico({
          indice_personas_expuestas_teorico:
            indicesTeoricos.indice_personas_expuestas ?? undefined,
          indice_procedimientos_teorico:
            indicesTeoricos.indice_procedimientos ?? undefined,
          indice_capacitacion_teorico:
            indicesTeoricos.indice_capacitacion ?? undefined,
          indice_exposicion_teorico:
            indicesTeoricos.indice_exposicion ?? undefined,
          indice_severidad_teorico:
            indicesTeoricos.indice_severidad ?? undefined,
        })
      }

      const hazardData = {
        assessment_id: assessmentId,
        factor_riesgo: factorRiesgo.trim(),
        categoria,
        work_position_id: workPositionId || null,
        fuente: fuente.trim() || null,
        efecto_posible: efectoPosible.trim() || null,
        indice_personas_expuestas: indices.indice_personas_expuestas,
        indice_procedimientos: indices.indice_procedimientos,
        indice_capacitacion: indices.indice_capacitacion,
        indice_exposicion: indices.indice_exposicion,
        indice_severidad: indices.indice_severidad,
        probabilidad: calc.probabilidad,
        nivel_riesgo: calc.nivelRiesgo,
        clasificacion: calc.clasificacion,
        medida_correctiva: medidaCorrectiva.trim() || null,
        responsable_mejora: responsableMejora.trim() || null,
        fecha_limite_mejora: fechaLimiteMejora || null,
        // Theoretical
        indice_personas_expuestas_teorico:
          indicesTeoricos.indice_personas_expuestas,
        indice_procedimientos_teorico:
          indicesTeoricos.indice_procedimientos,
        indice_capacitacion_teorico:
          indicesTeoricos.indice_capacitacion,
        indice_exposicion_teorico:
          indicesTeoricos.indice_exposicion,
        indice_severidad_teorico: indicesTeoricos.indice_severidad,
        probabilidad_teorica: calcTeorico?.probabilidad ?? null,
        nivel_riesgo_teorico: calcTeorico?.nivelRiesgo ?? null,
        clasificacion_teorica: calcTeorico?.clasificacion ?? null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("hazards")
          .update(hazardData)
          .eq("id", hazard!.id)
        if (error) throw error
        toast.success("Peligro actualizado correctamente")
      } else {
        const { error } = await supabase.from("hazards").insert(hazardData)
        if (error) throw error
        toast.success("Peligro agregado correctamente")
      }

      onSaved()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el peligro")
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = factorRiesgo.trim().length > 0 && categoria !== ""

  const renderIndiceSelect = (
    field: (typeof INDICE_FIELDS)[number],
    values: Record<IndiceKey, number | null>,
    setter: React.Dispatch<React.SetStateAction<Record<IndiceKey, number | null>>>
  ) => {
    const config = INDICE_LABELS[field.labelKey]
    return (
      <div key={field.key} className="space-y-1.5">
        <Label className="text-sm">
          {config.label}
          <span className="text-muted-foreground text-xs ml-1.5 font-normal">
            {config.description}
          </span>
        </Label>
        <Select
          value={values[field.key]?.toString() || ""}
          onValueChange={(v) =>
            setter((prev) => ({
              ...prev,
              [field.key]: parseInt(v),
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar valor" />
          </SelectTrigger>
          <SelectContent>
            {config.scale.map((s) => (
              <SelectItem key={s.value} value={s.value.toString()}>
                <span className="font-medium">{s.value}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  — {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Peligro" : "Agregar Peligro"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Factor de riesgo *</Label>
              <Input
                value={factorRiesgo}
                onChange={(e) => setFactorRiesgo(e.target.value)}
                placeholder="Ej: Exposición a ruido continuo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Categoría *</Label>
                <Select
                  value={categoria}
                  onValueChange={(v) =>
                    setCategoria(v as HazardCategoria)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(HAZARD_CATEGORIAS) as [
                        HazardCategoria,
                        string,
                      ][]
                    ).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Puesto de trabajo</Label>
                <Select
                  value={workPositionId}
                  onValueChange={setWorkPositionId}
                  disabled={workPositions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        workPositions.length === 0
                          ? "Sin puestos disponibles"
                          : "Seleccionar puesto"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin puesto específico</SelectItem>
                    {workPositions.map((wp) => (
                      <SelectItem key={wp.id} value={wp.id}>
                        {wp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Fuente del peligro</Label>
                <Input
                  value={fuente}
                  onChange={(e) => setFuente(e.target.value)}
                  placeholder="Ej: Maquinaria sin protección"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Efecto posible</Label>
                <Input
                  value={efectoPosible}
                  onChange={(e) => setEfectoPosible(e.target.value)}
                  placeholder="Ej: Hipoacusia inducida"
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Sub-indices */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">
              Evaluación de Riesgo (Índices)
            </h4>
            {INDICE_FIELDS.map((field) =>
              renderIndiceSelect(field, indices, setIndices)
            )}
          </div>

          {/* Live result */}
          {riskCalc && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="text-sm font-semibold">Resultado</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">
                    Probabilidad
                  </span>
                  <p className="font-medium">
                    {riskCalc.probabilidad.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Nivel de Riesgo
                  </span>
                  <p className="font-medium">
                    {riskCalc.nivelRiesgo.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    Clasificación
                  </span>
                  <Badge
                    className={cn(
                      "mt-0.5",
                      RISK_CLASIFICACION_COLORS[riskCalc.clasificacion]
                    )}
                  >
                    {riskCalc.clasificacion}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="border-t" />

          {/* Corrective measures */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Medida Correctiva</h4>
            <div className="space-y-1.5">
              <Label className="text-sm">Descripción de la medida</Label>
              <Textarea
                value={medidaCorrectiva}
                onChange={(e) => setMedidaCorrectiva(e.target.value)}
                placeholder="Describir la medida correctiva o preventiva propuesta..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Responsable</Label>
                <Input
                  value={responsableMejora}
                  onChange={(e) => setResponsableMejora(e.target.value)}
                  placeholder="Nombre del responsable"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Fecha límite</Label>
                <Input
                  type="date"
                  value={fechaLimiteMejora}
                  onChange={(e) => setFechaLimiteMejora(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Theoretical re-evaluation (collapsible) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowTeorico((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors w-full text-left"
            >
              {showTeorico ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Reevaluación Teórica (con mejoras)
            </button>

            {showTeorico && (
              <div className="space-y-3 pl-1">
                <p className="text-xs text-muted-foreground">
                  Evalúe los índices estimados luego de implementar las medidas
                  correctivas propuestas.
                </p>
                {INDICE_FIELDS.map((field) =>
                  renderIndiceSelect(field, indicesTeoricos, setIndicesTeoricos)
                )}

                {riskCalcTeorico && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="text-sm font-semibold">
                      Resultado Teórico
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Probabilidad
                        </span>
                        <p className="font-medium">
                          {riskCalcTeorico.probabilidad.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Nivel de Riesgo
                        </span>
                        <p className="font-medium">
                          {riskCalcTeorico.nivelRiesgo.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Clasificación
                        </span>
                        <Badge
                          className={cn(
                            "mt-0.5",
                            RISK_CLASIFICACION_COLORS[
                              riskCalcTeorico.clasificacion
                            ]
                          )}
                        >
                          {riskCalcTeorico.clasificacion}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Actualizar" : "Agregar peligro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

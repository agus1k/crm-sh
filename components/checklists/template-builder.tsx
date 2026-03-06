"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  BookOpen,
  AlertTriangle,
} from "lucide-react"
import type { ChecklistResponseType } from "@/lib/crm-types"

export interface TemplateItemDraft {
  _tempId: string
  orden: number
  seccion: string
  pregunta: string
  tipo_respuesta: ChecklistResponseType
  opciones: string[] | null
  normativa_ref: string
  es_critico: boolean
}

const RESPONSE_TYPES: { value: ChecklistResponseType; label: string }[] = [
  { value: "si_no_na", label: "Sí / No / N-A" },
  { value: "si_no", label: "Sí / No" },
  { value: "texto", label: "Texto libre" },
  { value: "numerico", label: "Numérico" },
  { value: "seleccion", label: "Selección" },
  { value: "foto", label: "Foto" },
]

interface TemplateBuilderProps {
  items: TemplateItemDraft[]
  onChange: (items: TemplateItemDraft[]) => void
  disabled?: boolean
}

let tempIdCounter = 0
function genTempId() {
  return `_tmp_${++tempIdCounter}_${Date.now()}`
}

export function createEmptyItem(orden: number, seccion?: string): TemplateItemDraft {
  return {
    _tempId: genTempId(),
    orden,
    seccion: seccion || "",
    pregunta: "",
    tipo_respuesta: "si_no_na",
    opciones: null,
    normativa_ref: "",
    es_critico: false,
  }
}

export function TemplateBuilder({
  items,
  onChange,
  disabled = false,
}: TemplateBuilderProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const updateItem = useCallback(
    (tempId: string, patch: Partial<TemplateItemDraft>) => {
      onChange(
        items.map((it) =>
          it._tempId === tempId ? { ...it, ...patch } : it
        )
      )
    },
    [items, onChange]
  )

  const addItem = useCallback(() => {
    const lastItem = items[items.length - 1]
    const newItem = createEmptyItem(
      items.length + 1,
      lastItem?.seccion || ""
    )
    onChange([...items, newItem])
    setExpandedItem(newItem._tempId)
  }, [items, onChange])

  const removeItem = useCallback(
    (tempId: string) => {
      const filtered = items
        .filter((it) => it._tempId !== tempId)
        .map((it, idx) => ({ ...it, orden: idx + 1 }))
      onChange(filtered)
      if (expandedItem === tempId) setExpandedItem(null)
    },
    [items, onChange, expandedItem]
  )

  const moveItem = useCallback(
    (tempId: string, direction: "up" | "down") => {
      const idx = items.findIndex((it) => it._tempId === tempId)
      if (idx < 0) return
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= items.length) return
      const next = [...items]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      onChange(next.map((it, i) => ({ ...it, orden: i + 1 })))
    },
    [items, onChange]
  )

  const addSectionHeader = useCallback(() => {
    const newItem = createEmptyItem(items.length + 1)
    newItem.seccion = "Nueva Sección"
    onChange([...items, newItem])
    setExpandedItem(newItem._tempId)
  }, [items, onChange])

  // Group by section for display
  const sections = new Map<string, TemplateItemDraft[]>()
  for (const item of items) {
    const key = item.seccion || "Sin sección"
    const existing = sections.get(key) || []
    existing.push(item)
    sections.set(key, existing)
  }

  return (
    <div className="space-y-4">
      {/* Item list */}
      <div className="space-y-1">
        {items.map((item, idx) => {
          const isExpanded = expandedItem === item._tempId
          const isFirstOfSection =
            idx === 0 || items[idx - 1].seccion !== item.seccion

          return (
            <div key={item._tempId}>
              {/* Section header */}
              {isFirstOfSection && item.seccion && (
                <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {item.seccion}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* Item row */}
              <div
                className={cn(
                  "border rounded-lg transition-colors",
                  isExpanded
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                {/* Collapsed row */}
                <div
                  className="flex items-center gap-2 p-2.5 cursor-pointer"
                  onClick={() =>
                    !disabled &&
                    setExpandedItem(isExpanded ? null : item._tempId)
                  }
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
                    {item.orden}
                  </span>
                  <p
                    className={cn(
                      "text-sm flex-1 min-w-0 truncate",
                      item.pregunta
                        ? "text-foreground"
                        : "text-muted-foreground italic"
                    )}
                  >
                    {item.pregunta || "Pregunta sin texto..."}
                  </p>
                  <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                    {RESPONSE_TYPES.find((r) => r.value === item.tipo_respuesta)
                      ?.label || item.tipo_respuesta}
                  </Badge>
                  {item.es_critico && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                  {!disabled && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveItem(item._tempId, "up")
                        }}
                        disabled={idx === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveItem(item._tempId, "down")
                        }}
                        disabled={idx === items.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeItem(item._tempId)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded editor */}
                {isExpanded && !disabled && (
                  <div className="px-3 pb-3 space-y-3 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Pregunta</Label>
                        <Input
                          value={item.pregunta}
                          onChange={(e) =>
                            updateItem(item._tempId, {
                              pregunta: e.target.value,
                            })
                          }
                          placeholder="Escriba la pregunta..."
                          className="text-sm mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Sección</Label>
                        <Input
                          value={item.seccion}
                          onChange={(e) =>
                            updateItem(item._tempId, {
                              seccion: e.target.value,
                            })
                          }
                          placeholder="Nombre de sección"
                          className="text-sm mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Tipo de respuesta</Label>
                        <Select
                          value={item.tipo_respuesta}
                          onValueChange={(v) =>
                            updateItem(item._tempId, {
                              tipo_respuesta: v as ChecklistResponseType,
                              opciones:
                                v === "seleccion"
                                  ? item.opciones || ["Bueno", "Regular", "Malo"]
                                  : null,
                            })
                          }
                        >
                          <SelectTrigger className="text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TYPES.map((rt) => (
                              <SelectItem key={rt.value} value={rt.value}>
                                {rt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {item.tipo_respuesta === "seleccion" && (
                        <div className="sm:col-span-2">
                          <Label className="text-xs">
                            Opciones (separadas por coma)
                          </Label>
                          <Input
                            value={(item.opciones || []).join(", ")}
                            onChange={(e) =>
                              updateItem(item._tempId, {
                                opciones: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Bueno, Regular, Malo"
                            className="text-sm mt-1"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs">
                          Referencia normativa (opcional)
                        </Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={item.normativa_ref}
                            onChange={(e) =>
                              updateItem(item._tempId, {
                                normativa_ref: e.target.value,
                              })
                            }
                            placeholder="Art. 176 Dec. 351/79"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <Checkbox
                          checked={item.es_critico}
                          onCheckedChange={(checked) =>
                            updateItem(item._tempId, {
                              es_critico: !!checked,
                            })
                          }
                        />
                        <Label className="text-xs flex items-center gap-1 cursor-pointer">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          Ítem crítico (genera observación automática si no cumple)
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add buttons */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addItem}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar pregunta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={addSectionHeader}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva sección
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No hay preguntas todavía</p>
          <p className="text-xs mt-1">
            Agregue preguntas para crear su plantilla de checklist
          </p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  X,
  Minus,
  AlertTriangle,
  BookOpen,
} from "lucide-react"
import type { ChecklistTemplateItem } from "@/lib/crm-types"

interface QuestionItemProps {
  templateItem: ChecklistTemplateItem
  respuesta: string | null
  observacion: string | null
  onResponse: (respuesta: string) => void
  onObservation: (observacion: string) => void
  disabled?: boolean
}

export function QuestionItem({
  templateItem,
  respuesta,
  observacion,
  onResponse,
  onObservation,
  disabled = false,
}: QuestionItemProps) {
  const [showObservation, setShowObservation] = useState(
    () => !!(observacion && observacion.length > 0) ||
      (templateItem.es_critico && respuesta === "no")
  )

  const isCriticalFail = templateItem.es_critico && respuesta === "no"

  // Auto-expand observation on critical failure
  const handleResponse = (value: string) => {
    onResponse(value)
    if (templateItem.es_critico && value === "no") {
      setShowObservation(true)
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 sm:p-4 transition-colors",
        isCriticalFail
          ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : respuesta
            ? "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10"
            : "border-border bg-card"
      )}
    >
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-6 text-right">
          {templateItem.orden}.
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm text-foreground flex-1">
              {templateItem.pregunta}
            </p>
            {templateItem.es_critico && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] px-1.5 py-0 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
              >
                Crítico
              </Badge>
            )}
          </div>

          {templateItem.normativa_ref && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {templateItem.normativa_ref}
            </p>
          )}

          {/* Response controls */}
          <div className="mt-3">
            {(templateItem.tipo_respuesta === "si_no_na" ||
              templateItem.tipo_respuesta === "si_no") && (
              <SiNoButtons
                value={respuesta}
                onChange={handleResponse}
                includeNA={templateItem.tipo_respuesta === "si_no_na"}
                disabled={disabled}
              />
            )}

            {templateItem.tipo_respuesta === "texto" && (
              <Textarea
                value={respuesta || ""}
                onChange={(e) => onResponse(e.target.value)}
                placeholder="Ingrese texto..."
                className="text-sm min-h-[60px]"
                disabled={disabled}
              />
            )}

            {templateItem.tipo_respuesta === "numerico" && (
              <Input
                type="number"
                value={respuesta || ""}
                onChange={(e) => onResponse(e.target.value)}
                placeholder="Ingrese valor..."
                className="text-sm w-40"
                disabled={disabled}
              />
            )}

            {templateItem.tipo_respuesta === "seleccion" &&
              templateItem.opciones && (
                <Select
                  value={respuesta || ""}
                  onValueChange={onResponse}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-[200px] text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templateItem.opciones.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

            {templateItem.tipo_respuesta === "foto" && (
              <div className="text-xs text-muted-foreground italic">
                Adjuntar foto (disponible en versión futura)
              </div>
            )}
          </div>

          {/* Critical failure warning */}
          {isCriticalFail && (
            <div className="flex items-center gap-1.5 mt-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                Ítem crítico no cumplido — se generará observación automática
              </span>
            </div>
          )}

          {/* Observation field (auto-shown on critical fail, or toggleable) */}
          {!disabled && (
            <div className="mt-2">
              {!showObservation && respuesta && (
                <button
                  type="button"
                  onClick={() => setShowObservation(true)}
                  className="text-xs text-primary hover:underline"
                >
                  + Agregar observación
                </button>
              )}
              {showObservation && (
                <Textarea
                  value={observacion || ""}
                  onChange={(e) => onObservation(e.target.value)}
                  placeholder={
                    isCriticalFail
                      ? "Describa la no conformidad encontrada..."
                      : "Observación opcional..."
                  }
                  className="text-sm min-h-[50px] mt-1"
                />
              )}
            </div>
          )}

          {/* Read-only observation display */}
          {disabled && observacion && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Obs: {observacion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Si/No/NA toggle buttons
function SiNoButtons({
  value,
  onChange,
  includeNA = true,
  disabled = false,
}: {
  value: string | null
  onChange: (v: string) => void
  includeNA?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant={value === "si" ? "default" : "outline"}
        className={cn(
          "h-8 gap-1 text-xs",
          value === "si" &&
            "bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
        )}
        onClick={() => onChange("si")}
        disabled={disabled}
      >
        <Check className="h-3.5 w-3.5" />
        Sí
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "no" ? "default" : "outline"}
        className={cn(
          "h-8 gap-1 text-xs",
          value === "no" &&
            "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600"
        )}
        onClick={() => onChange("no")}
        disabled={disabled}
      >
        <X className="h-3.5 w-3.5" />
        No
      </Button>
      {includeNA && (
        <Button
          type="button"
          size="sm"
          variant={value === "na" ? "default" : "outline"}
          className={cn(
            "h-8 gap-1 text-xs",
            value === "na" &&
              "bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500"
          )}
          onClick={() => onChange("na")}
          disabled={disabled}
        >
          <Minus className="h-3.5 w-3.5" />
          N/A
        </Button>
      )}
    </div>
  )
}

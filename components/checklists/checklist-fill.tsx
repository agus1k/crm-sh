"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { QuestionItem } from "./question-item"
import { useChecklistStore } from "@/lib/stores/checklist-store"
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  BarChart3,
} from "lucide-react"
import type { ChecklistTemplateItem } from "@/lib/crm-types"

interface ChecklistFillProps {
  templateItems: ChecklistTemplateItem[]
  disabled?: boolean
}

export function ChecklistFill({ templateItems, disabled = false }: ChecklistFillProps) {
  const { items, setResponse, getProgress, getScore } = useChecklistStore()

  const progress = getProgress()
  const score = getScore()

  // Group items by section
  const sections = useMemo(() => {
    const map = new Map<string, ChecklistTemplateItem[]>()
    for (const item of templateItems) {
      const key = item.seccion || "General"
      const existing = map.get(key) || []
      existing.push(item)
      map.set(key, existing)
    }
    return Array.from(map.entries())
  }, [templateItems])

  const handleResponse = (templateItemId: string, respuesta: string) => {
    setResponse(templateItemId, { respuesta } as any)
  }

  const handleObservation = (templateItemId: string, observacion: string) => {
    setResponse(templateItemId, { observacion } as any)
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Progreso: {progress.answered} / {progress.total} preguntas
          </span>
          <span className="text-sm font-medium">{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} className="h-2" />

        {/* Score summary (show when at least some items answered) */}
        {(score.cumple + score.noCumple + score.na > 0) && (
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Puntuación:</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  score.percentage >= 80
                    ? "text-green-600 dark:text-green-400"
                    : score.percentage >= 60
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                )}
              >
                {score.percentage}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                {score.cumple}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" />
                {score.noCumple}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MinusCircle className="h-3 w-3" />
                {score.na}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sections with questions */}
      {sections.map(([sectionName, sectionItems]) => (
        <div key={sectionName}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {sectionName}
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {sectionItems.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {sectionItems.map((ti) => {
              const item = items.get(ti.id)
              return (
                <QuestionItem
                  key={ti.id}
                  templateItem={ti}
                  respuesta={item?.respuesta || null}
                  observacion={item?.observacion || null}
                  onResponse={(r) => handleResponse(ti.id, r)}
                  onObservation={(o) => handleObservation(ti.id, o)}
                  disabled={disabled}
                />
              )
            })}
          </div>
        </div>
      ))}

      {/* Final score summary */}
      {progress.percentage === 100 && (
        <div
          className={cn(
            "rounded-xl border-2 p-6 text-center",
            score.percentage >= 80
              ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
              : score.percentage >= 60
                ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
                : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
          )}
        >
          <p className="text-lg font-bold text-foreground mb-1">
            Checklist Completado
          </p>
          <p className="text-3xl font-bold mb-2">
            <span
              className={cn(
                score.percentage >= 80
                  ? "text-green-600 dark:text-green-400"
                  : score.percentage >= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              )}
            >
              {score.percentage}%
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {score.cumple} cumple &middot; {score.noCumple} no cumple &middot;{" "}
            {score.na} N/A
          </p>
        </div>
      )}
    </div>
  )
}

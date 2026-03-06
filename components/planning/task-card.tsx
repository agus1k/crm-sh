"use client"

import { cn } from "@/lib/utils"
import type { PlanTask } from "@/lib/crm-types"
import { PLAN_TASK_TYPES, PLAN_TASK_STATUSES } from "@/lib/crm-types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TaskCardProps {
  task: PlanTask
  onClick: (task: PlanTask) => void
}

const statusBorder: Record<string, string> = {
  planificado: "border-gray-300 dark:border-gray-600",
  en_proceso: "border-blue-400 dark:border-blue-500",
  realizado: "border-green-400 dark:border-green-500",
  pendiente: "border-yellow-400 dark:border-yellow-500",
  cancelado: "border-red-300 dark:border-red-500",
}

const statusRing: Record<string, string> = {
  planificado: "",
  en_proceso: "ring-1 ring-blue-200 dark:ring-blue-800",
  realizado: "ring-1 ring-green-200 dark:ring-green-800",
  pendiente: "ring-1 ring-yellow-200 dark:ring-yellow-800",
  cancelado: "opacity-50",
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const typeInfo = PLAN_TASK_TYPES[task.tipo]
  const statusInfo = PLAN_TASK_STATUSES[task.status]

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick(task)}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-[10px] font-bold text-white transition-all hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "h-7 min-w-[28px] px-1 border-2",
              typeInfo.color,
              statusBorder[task.status],
              statusRing[task.status]
            )}
          >
            {typeInfo.abbr}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-semibold text-xs">{task.titulo}</p>
          <p className="text-[10px] text-muted-foreground">
            {typeInfo.label} &middot; {statusInfo.label}
          </p>
          {task.fecha_programada && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(task.fecha_programada).toLocaleDateString("es-AR")}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

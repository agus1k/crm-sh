"use client"

import { cn } from "@/lib/utils"
import type { PlanTask, PlanTaskType, PlanTaskStatus } from "@/lib/crm-types"
import {
  PLAN_TASK_TYPES,
  MESES_CORTOS,
} from "@/lib/crm-types"
import { TaskCard } from "./task-card"
import { Plus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MonthGridProps {
  tasks: PlanTask[]
  filterType: PlanTaskType | "all"
  filterStatus: PlanTaskStatus | "all"
  onTaskClick: (task: PlanTask) => void
  onCellClick: (mes: number, tipo: PlanTaskType) => void
}

// Order task types appear in the grid rows
const TASK_TYPE_ORDER: PlanTaskType[] = [
  "visita",
  "medicion_iluminacion",
  "medicion_ruido",
  "medicion_pat",
  "carga_de_fuego",
  "relevamiento_riesgos",
  "checklist",
  "capacitacion",
  "simulacro",
  "auditoria",
  "otro",
]

export function MonthGrid({
  tasks,
  filterType,
  filterStatus,
  onTaskClick,
  onCellClick,
}: MonthGridProps) {
  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filterType !== "all" && t.tipo !== filterType) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    return true
  })

  // Build a lookup: tipo -> mes -> tasks[]
  const grid: Record<string, Record<number, PlanTask[]>> = {}
  for (const tipo of TASK_TYPE_ORDER) {
    grid[tipo] = {}
    for (let m = 1; m <= 12; m++) {
      grid[tipo][m] = []
    }
  }
  for (const task of filteredTasks) {
    if (grid[task.tipo]) {
      grid[task.tipo][task.mes].push(task)
    }
  }

  // Determine which rows have any tasks (or show all if no filter)
  const visibleTypes =
    filterType === "all"
      ? TASK_TYPE_ORDER
      : TASK_TYPE_ORDER.filter((t) => t === filterType)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Desktop grid */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 w-[160px] border-b border-r border-border sticky left-0 bg-muted/50 z-10">
                Actividad
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  className={cn(
                    "text-center text-xs font-medium px-1 py-2.5 border-b border-r border-border min-w-[60px]",
                    m === currentMonth
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  )}
                >
                  {MESES_CORTOS[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTypes.map((tipo) => {
              const typeInfo = PLAN_TASK_TYPES[tipo]
              return (
                <tr key={tipo} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 border-r border-b border-border sticky left-0 bg-card z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded text-[9px] font-bold text-white h-5 w-5 shrink-0",
                          typeInfo.color
                        )}
                      >
                        {typeInfo.abbr}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {typeInfo.label}
                      </span>
                    </div>
                  </td>
                  {months.map((m) => {
                    const cellTasks = grid[tipo][m]
                    return (
                      <td
                        key={m}
                        className={cn(
                          "border-r border-b border-border text-center align-middle px-1 py-1.5",
                          m === currentMonth && "bg-primary/5"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-center gap-1 min-h-[28px]">
                          {cellTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={onTaskClick}
                            />
                          ))}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onCellClick(m, tipo)}
                                  className="inline-flex items-center justify-center rounded h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  Agregar {typeInfo.label.toLowerCase()} en {MESES_CORTOS[m]}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden divide-y divide-border">
        {months.map((m) => {
          const monthTasks = filteredTasks.filter((t) => t.mes === m)
          if (monthTasks.length === 0 && filterType !== "all") return null
          return (
            <div key={m} className={cn("px-3 py-2.5", m === currentMonth && "bg-primary/5")}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    m === currentMonth ? "text-primary" : "text-foreground"
                  )}
                >
                  {MESES_CORTOS[m]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {monthTasks.length} {monthTasks.length === 1 ? "tarea" : "tareas"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {monthTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                ))}
                {monthTasks.length === 0 && (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

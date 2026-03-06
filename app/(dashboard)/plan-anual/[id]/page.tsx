"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { usePlanningStore } from "@/lib/stores/planning-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MonthGrid } from "@/components/planning/month-grid"
import { TaskForm } from "@/components/planning/task-form"
import { PlanForm } from "@/components/planning/plan-form"
import {
  Plus,
  Loader2,
  Building2,
  MapPin,
  Pencil,
  CalendarRange,
  Filter,
} from "lucide-react"
import type {
  AnnualPlan,
  PlanTask,
  PlanTaskType,
  PlanTaskStatus,
} from "@/lib/crm-types"
import {
  PLAN_STATUSES,
  PLAN_TASK_TYPES,
  PLAN_TASK_STATUSES,
} from "@/lib/crm-types"
import { toast } from "sonner"

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuthStore()
  const {
    filterType,
    filterStatus,
    setFilterType,
    setFilterStatus,
    reset,
  } = usePlanningStore()

  const planId = params.id as string

  const [plan, setPlan] = useState<AnnualPlan | null>(null)
  const [tasks, setTasks] = useState<PlanTask[]>([])
  const [loading, setLoading] = useState(true)

  // Task form state
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null)
  const [defaultMes, setDefaultMes] = useState<number | undefined>(undefined)
  const [defaultTipo, setDefaultTipo] = useState<PlanTaskType | undefined>(undefined)

  // Plan edit form
  const [planFormOpen, setPlanFormOpen] = useState(false)

  const loadPlan = useCallback(async () => {
    if (!planId) return
    setLoading(true)
    const supabase = createClient()

    const [planRes, tasksRes] = await Promise.all([
      supabase
        .from("annual_plans")
        .select("*, client:clients(razon_social, id), establishment:establishments(nombre, id)")
        .eq("id", planId)
        .single(),
      supabase
        .from("plan_tasks")
        .select("*, assignee:profiles!plan_tasks_assigned_to_fkey(full_name)")
        .eq("plan_id", planId)
        .order("mes", { ascending: true }),
    ])

    if (planRes.error || !planRes.data) {
      toast.error("Plan no encontrado")
      router.push("/plan-anual")
      return
    }

    setPlan(planRes.data as unknown as AnnualPlan)
    setTasks((tasksRes.data as PlanTask[]) || [])
    setLoading(false)
  }, [planId, router])

  useEffect(() => {
    loadPlan()
    return () => reset()
  }, [loadPlan, reset])

  const handleTaskClick = (task: PlanTask) => {
    setEditingTask(task)
    setDefaultMes(undefined)
    setDefaultTipo(undefined)
    setTaskFormOpen(true)
  }

  const handleCellClick = (mes: number, tipo: PlanTaskType) => {
    setEditingTask(null)
    setDefaultMes(mes)
    setDefaultTipo(tipo)
    setTaskFormOpen(true)
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setDefaultMes(new Date().getMonth() + 1)
    setDefaultTipo(undefined)
    setTaskFormOpen(true)
  }

  if (loading) {
    return (
      <>
        <Topbar title="Plan Anual" description="Cargando..." />
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando plan...</span>
        </div>
      </>
    )
  }

  if (!plan) return null

  const statusInfo = PLAN_STATUSES[plan.status]
  const clientName = (plan.client as any)?.razon_social || "Cliente"
  const establishmentName = (plan.establishment as any)?.nombre

  // Stats
  const total = tasks.length
  const realizados = tasks.filter((t) => t.status === "realizado").length
  const enProceso = tasks.filter((t) => t.status === "en_proceso").length
  const pendientes = tasks.filter((t) => t.status === "pendiente").length
  const progress = total > 0 ? Math.round((realizados / total) * 100) : 0

  return (
    <>
      <Topbar title="Plan Anual" description={plan.titulo} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/plan-anual">Plan Anual</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{plan.titulo}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-4 lg:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-lg font-semibold text-foreground">
                  {plan.titulo}
                </h1>
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {clientName}
                </div>
                {establishmentName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {establishmentName}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5" />
                  {plan.anio}
                </div>
              </div>
              {plan.descripcion && (
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.descripcion}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlanFormOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              <Button size="sm" onClick={handleNewTask}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva tarea
              </Button>
            </div>
          </div>

          {/* Progress stats */}
          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 min-w-[120px] max-w-[200px] rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{total} total</span>
                  <span className="text-green-600 dark:text-green-400">
                    {realizados} realizadas
                  </span>
                  {enProceso > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {enProceso} en proceso
                    </span>
                  )}
                  {pendientes > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {pendientes} pendientes
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Filtros:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filterType}
              onValueChange={(val) => setFilterType(val as PlanTaskType | "all")}
            >
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="Tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las actividades</SelectItem>
                {Object.entries(PLAN_TASK_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(val) =>
                setFilterStatus(val as PlanTaskStatus | "all")
              }
            >
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(PLAN_TASK_STATUSES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterType !== "all" || filterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setFilterType("all")
                  setFilterStatus("all")
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Month grid */}
        <MonthGrid
          tasks={tasks}
          filterType={filterType}
          filterStatus={filterStatus}
          onTaskClick={handleTaskClick}
          onCellClick={handleCellClick}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Tipos:
          </span>
          {Object.entries(PLAN_TASK_TYPES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center justify-center rounded text-[8px] font-bold text-white h-4 w-4 ${val.color}`}
              >
                {val.abbr}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {val.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Task form dialog */}
      {profile?.organization_id && (
        <TaskForm
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          task={editingTask}
          planId={planId}
          organizationId={profile.organization_id}
          defaultMes={defaultMes}
          defaultTipo={defaultTipo}
          onSaved={loadPlan}
        />
      )}

      {/* Plan edit dialog */}
      <PlanForm
        open={planFormOpen}
        onOpenChange={setPlanFormOpen}
        plan={plan}
        onSaved={loadPlan}
      />
    </>
  )
}

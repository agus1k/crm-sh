"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { usePlanningStore } from "@/lib/stores/planning-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlanForm } from "@/components/planning/plan-form"
import {
  CalendarRange,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Loader2,
  ChevronRight,
  ListChecks,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AnnualPlan, Client } from "@/lib/crm-types"
import { PLAN_STATUSES } from "@/lib/crm-types"
import { toast } from "sonner"
import Link from "next/link"

export default function PlanAnualPage() {
  const { profile } = useAuthStore()
  const { selectedYear, setSelectedYear } = usePlanningStore()
  const [plans, setPlans] = useState<AnnualPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AnnualPlan | null>(null)

  const loadPlans = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("annual_plans")
      .select(
        "*, client:clients(razon_social), establishment:establishments(nombre), plan_tasks:plan_tasks(id)"
      )
      .eq("organization_id", profile.organization_id)
      .eq("anio", selectedYear)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar planes")
      setLoading(false)
      return
    }

    // Map the _count
    const mapped = (data || []).map((p: any) => ({
      ...p,
      _count: { tasks: p.plan_tasks?.length || 0 },
    }))
    setPlans(mapped as AnnualPlan[])
    setLoading(false)
  }, [profile?.organization_id, selectedYear])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("annual_plans").delete().eq("id", id)
    if (error) {
      toast.error("Error al eliminar plan")
      return
    }
    toast.success("Plan eliminado")
    loadPlans()
  }

  const filtered = plans.filter((p) => {
    const clientName = (p.client as any)?.razon_social || ""
    const q = search.toLowerCase()
    return (
      p.titulo.toLowerCase().includes(q) ||
      clientName.toLowerCase().includes(q)
    )
  })

  // Group by client
  const grouped: Record<string, { clientName: string; plans: AnnualPlan[] }> = {}
  for (const plan of filtered) {
    const cid = plan.client_id
    const clientName = (plan.client as any)?.razon_social || "Sin cliente"
    if (!grouped[cid]) {
      grouped[cid] = { clientName, plans: [] }
    }
    grouped[cid].plans.push(plan)
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  return (
    <>
      <Topbar title="Plan Anual" description="Planificación anual de actividades por cliente" />
      <div className="p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingPlan(null)
              setDialogOpen(true)
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo plan</span>
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando planes...</span>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <CalendarRange className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "No se encontraron planes"
                : `No hay planes para ${selectedYear}`}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingPlan(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear primer plan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([clientId, { clientName, plans: clientPlans }]) => (
              <div key={clientId}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {clientName}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({clientPlans.length} {clientPlans.length === 1 ? "plan" : "planes"})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {clientPlans.map((plan) => {
                    const statusInfo = PLAN_STATUSES[plan.status]
                    const establishmentName = (plan.establishment as any)?.nombre
                    const taskCount = plan._count?.tasks || 0
                    return (
                      <Link
                        key={plan.id}
                        href={`/plan-anual/${plan.id}`}
                        className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:border-primary/20 transition-all group block"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {plan.titulo}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {plan.anio}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setEditingPlan(plan)
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete(plan.id)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          {establishmentName && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{establishmentName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ListChecks className="h-3 w-3 shrink-0" />
                            <span>
                              {taskCount} {taskCount === 1 ? "tarea" : "tareas"} planificadas
                            </span>
                          </div>
                          {plan.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {plan.descripcion}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlanForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSaved={loadPlans}
      />
    </>
  )
}

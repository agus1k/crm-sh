"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, Trash2 } from "lucide-react"
import type { PlanTask, PlanTaskType, PlanTaskStatus, Profile } from "@/lib/crm-types"
import {
  PLAN_TASK_TYPES,
  PLAN_TASK_STATUSES,
  MESES,
} from "@/lib/crm-types"
import { toast } from "sonner"

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: PlanTask | null
  planId: string
  organizationId: string
  defaultMes?: number
  defaultTipo?: PlanTaskType
  onSaved: () => void
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  planId,
  organizationId,
  defaultMes,
  defaultTipo,
  onSaved,
}: TaskFormProps) {
  const { profile } = useAuthStore()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<PlanTaskType>("visita")
  const [mes, setMes] = useState(1)
  const [status, setStatus] = useState<PlanTaskStatus>("planificado")
  const [assignedTo, setAssignedTo] = useState("")
  const [fechaProgramada, setFechaProgramada] = useState("")
  const [fechaRealizacion, setFechaRealizacion] = useState("")
  const [notas, setNotas] = useState("")

  // Reset form when task/defaults change
  useEffect(() => {
    if (task) {
      setTitulo(task.titulo)
      setDescripcion(task.descripcion || "")
      setTipo(task.tipo)
      setMes(task.mes)
      setStatus(task.status)
      setAssignedTo(task.assigned_to || "")
      setFechaProgramada(task.fecha_programada || "")
      setFechaRealizacion(task.fecha_realizacion || "")
      setNotas(task.notas || "")
    } else {
      const t = defaultTipo || "visita"
      setTitulo(PLAN_TASK_TYPES[t].label)
      setDescripcion("")
      setTipo(t)
      setMes(defaultMes || new Date().getMonth() + 1)
      setStatus("planificado")
      setAssignedTo("")
      setFechaProgramada("")
      setFechaRealizacion("")
      setNotas("")
    }
  }, [task, defaultMes, defaultTipo, open])

  // Load org profiles for assignment
  useEffect(() => {
    if (!organizationId || !open) return
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("full_name")
      setProfiles((data as Profile[]) || [])
    }
    load()
  }, [organizationId, open])

  // Auto-update title when type changes (only for new tasks)
  useEffect(() => {
    if (task) return
    setTitulo(PLAN_TASK_TYPES[tipo].label)
  }, [tipo, task])

  const handleSave = async () => {
    if (!titulo || !planId) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      plan_id: planId,
      organization_id: organizationId,
      mes,
      titulo,
      descripcion: descripcion || null,
      tipo,
      status,
      assigned_to: assignedTo || null,
      fecha_programada: fechaProgramada || null,
      fecha_realizacion: fechaRealizacion || null,
      notas: notas || null,
    }

    if (task?.id) {
      const { plan_id: _, organization_id: __, ...updatePayload } = payload
      const { error } = await supabase
        .from("plan_tasks")
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq("id", task.id)
      if (error) {
        toast.error("Error al actualizar tarea")
        setSaving(false)
        return
      }

      // Cascade status to linked event
      if (task.event_id) {
        await supabase
          .from("events")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", task.event_id)
      }

      toast.success("Tarea actualizada")
    } else {
      // Insert task
      const { data: newTask, error } = await supabase
        .from("plan_tasks")
        .insert(payload)
        .select()
        .single()
      if (error) {
        toast.error("Error al crear tarea")
        setSaving(false)
        return
      }

      // Auto-create linked event if date is set
      if (fechaProgramada && newTask) {
        const { data: newEvent } = await supabase
          .from("events")
          .insert({
            organization_id: organizationId,
            title: titulo,
            event_type: "inspeccion",
            event_date: new Date(fechaProgramada).toISOString(),
            status: "planificado",
            plan_task_id: newTask.id,
            assigned_to: assignedTo || null,
            created_by: profile?.id,
          })
          .select()
          .single()

        // Link event back to task
        if (newEvent) {
          await supabase
            .from("plan_tasks")
            .update({ event_id: newEvent.id })
            .eq("id", newTask.id)
        }
      }

      toast.success("Tarea creada")
    }
    setSaving(false)
    onOpenChange(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!task?.id) return
    setDeleting(true)
    const supabase = createClient()

    // Delete linked event first
    if (task.event_id) {
      await supabase.from("events").delete().eq("id", task.event_id)
    }

    const { error } = await supabase.from("plan_tasks").delete().eq("id", task.id)
    if (error) {
      toast.error("Error al eliminar tarea")
      setDeleting(false)
      return
    }
    toast.success("Tarea eliminada")
    setDeleting(false)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Modificá los datos de la tarea planificada"
              : "Agregá una nueva tarea al plan anual"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(val) => setTipo(val as PlanTaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_TASK_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Mes *</Label>
              <Select value={mes.toString()} onValueChange={(val) => setMes(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MESES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Visita mensual"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles de la tarea..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha programada</Label>
              <Input
                type="date"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
              />
            </div>

            {task && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as PlanTaskStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_TASK_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {task && (
            <div className="space-y-1.5">
              <Label>Fecha de realización</Label>
              <Input
                type="date"
                value={fechaRealizacion}
                onChange={(e) => setFechaRealizacion(e.target.value)}
              />
            </div>
          )}

          {profiles.length > 0 && (
            <div className="space-y-1.5">
              <Label>Asignado a</Label>
              <Select
                value={assignedTo || "none"}
                onValueChange={(val) => setAssignedTo(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || "Sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {task && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="mr-auto"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !titulo}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {task ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

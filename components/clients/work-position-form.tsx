"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { WorkPosition } from "@/lib/crm-types"
import { TURNOS } from "@/lib/crm-types"

interface WorkPositionFormProps {
  sectorId: string
  position?: WorkPosition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const emptyPosition: Partial<WorkPosition> = {
  nombre: "",
  descripcion: "",
  cantidad_trabajadores: 1,
  turno: null,
  horario_desde: null,
  horario_hasta: null,
  tareas_principales: "",
}

export function WorkPositionForm({
  sectorId,
  position,
  open,
  onOpenChange,
  onSaved,
}: WorkPositionFormProps) {
  const { profile } = useAuthStore()
  const [form, setForm] = useState<Partial<WorkPosition>>(
    position ? { ...position } : { ...emptyPosition }
  )
  const [saving, setSaving] = useState(false)

  const isEditing = !!position?.id

  const handleSave = async () => {
    if (!profile?.organization_id || !form.nombre?.trim()) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      nombre: form.nombre!.trim(),
      descripcion: form.descripcion || null,
      cantidad_trabajadores: form.cantidad_trabajadores || 1,
      turno: form.turno || null,
      horario_desde: form.horario_desde || null,
      horario_hasta: form.horario_hasta || null,
      tareas_principales: form.tareas_principales || null,
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      const { error } = await supabase
        .from("work_positions")
        .update(payload)
        .eq("id", position.id)
      if (error) {
        toast.error("Error al actualizar puesto de trabajo")
        setSaving(false)
        return
      }
      toast.success("Puesto de trabajo actualizado")
    } else {
      const { error } = await supabase.from("work_positions").insert({
        ...payload,
        organization_id: profile.organization_id,
        sector_id: sectorId,
      })
      if (error) {
        toast.error("Error al crear puesto de trabajo")
        setSaving(false)
        return
      }
      toast.success("Puesto de trabajo creado")
    }

    setSaving(false)
    onOpenChange(false)
    onSaved()
  }

  const update = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm(position ? { ...position } : { ...emptyPosition })
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar puesto de trabajo"
              : "Nuevo puesto de trabajo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Operador de torno, Administrativo"
                value={form.nombre || ""}
                onChange={(e) => update("nombre", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción del puesto..."
                value={form.descripcion || ""}
                onChange={(e) => update("descripcion", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trabajadores</Label>
              <Input
                type="number"
                min={1}
                value={form.cantidad_trabajadores || 1}
                onChange={(e) =>
                  update(
                    "cantidad_trabajadores",
                    parseInt(e.target.value) || 1
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Turno</Label>
              <Select
                value={form.turno || "none"}
                onValueChange={(v) =>
                  update("turno", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {Object.entries(TURNOS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horario desde</Label>
              <Input
                type="time"
                value={form.horario_desde || ""}
                onChange={(e) =>
                  update("horario_desde", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horario hasta</Label>
              <Input
                type="time"
                value={form.horario_hasta || ""}
                onChange={(e) =>
                  update("horario_hasta", e.target.value || null)
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Tareas principales</Label>
              <Textarea
                placeholder="Descripción de las tareas..."
                value={form.tareas_principales || ""}
                onChange={(e) => update("tareas_principales", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.nombre?.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

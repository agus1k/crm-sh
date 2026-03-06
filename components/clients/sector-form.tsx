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
import type { DBSector } from "@/lib/crm-types"
import { VENTILACION_TYPES } from "@/lib/crm-types"

interface SectorFormProps {
  establishmentId: string
  sector?: DBSector | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const NIVELES = [
  { value: "subsuelo", label: "Subsuelo" },
  { value: "planta_baja", label: "Planta Baja" },
  { value: "primer_piso", label: "Primer Piso" },
  { value: "segundo_piso", label: "Segundo Piso" },
  { value: "tercer_piso", label: "Tercer Piso" },
  { value: "otro", label: "Otro" },
]

const emptySector: Partial<DBSector> = {
  nombre: "",
  descripcion: "",
  superficie_m2: null,
  tipo_actividad: "",
  clase_ventilacion: null,
  cantidad_personal: 0,
  nivel: null,
}

export function SectorForm({
  establishmentId,
  sector,
  open,
  onOpenChange,
  onSaved,
}: SectorFormProps) {
  const { profile } = useAuthStore()
  const [form, setForm] = useState<Partial<DBSector>>(
    sector ? { ...sector } : { ...emptySector }
  )
  const [saving, setSaving] = useState(false)

  const isEditing = !!sector?.id

  const handleSave = async () => {
    if (!profile?.organization_id || !form.nombre?.trim()) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      nombre: form.nombre!.trim(),
      descripcion: form.descripcion || null,
      superficie_m2: form.superficie_m2 || null,
      tipo_actividad: form.tipo_actividad || null,
      clase_ventilacion: form.clase_ventilacion || null,
      cantidad_personal: form.cantidad_personal || 0,
      nivel: form.nivel || null,
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      const { error } = await supabase
        .from("sectors")
        .update(payload)
        .eq("id", sector.id)
      if (error) {
        toast.error("Error al actualizar sector")
        setSaving(false)
        return
      }
      toast.success("Sector actualizado")
    } else {
      const { error } = await supabase.from("sectors").insert({
        ...payload,
        organization_id: profile.organization_id,
        establishment_id: establishmentId,
      })
      if (error) {
        toast.error("Error al crear sector")
        setSaving(false)
        return
      }
      toast.success("Sector creado")
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
      setForm(sector ? { ...sector } : { ...emptySector })
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar sector" : "Nuevo sector"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Depósito, Oficinas, Planta baja"
                value={form.nombre || ""}
                onChange={(e) => update("nombre", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción del sector..."
                value={form.descripcion || ""}
                onChange={(e) => update("descripcion", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Superficie (m²)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.superficie_m2 ?? ""}
                onChange={(e) =>
                  update(
                    "superficie_m2",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Personal</Label>
              <Input
                type="number"
                min={0}
                value={form.cantidad_personal || 0}
                onChange={(e) =>
                  update("cantidad_personal", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de actividad</Label>
              <Input
                placeholder="Ej: Administrativa, Industrial"
                value={form.tipo_actividad || ""}
                onChange={(e) => update("tipo_actividad", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ventilación</Label>
              <Select
                value={form.clase_ventilacion || "none"}
                onValueChange={(v) =>
                  update("clase_ventilacion", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {Object.entries(VENTILACION_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Nivel</Label>
              <Select
                value={form.nivel || "none"}
                onValueChange={(v) =>
                  update("nivel", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {NIVELES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

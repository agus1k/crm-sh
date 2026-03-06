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
import type { Establishment } from "@/lib/crm-types"
import { PROVINCIAS } from "@/lib/crm-types"

interface EstablishmentFormProps {
  clientId: string
  establishment?: Establishment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const emptyEstablishment: Partial<Establishment> = {
  nombre: "",
  direccion: "",
  localidad: "",
  provincia: "Buenos Aires",
  codigo_postal: "",
  telefono: "",
  email: "",
  contacto_nombre: "",
  actividad_principal: "",
  ciiu: "",
  superficie_total_m2: null,
  cantidad_personal: 0,
}

export function EstablishmentForm({
  clientId,
  establishment,
  open,
  onOpenChange,
  onSaved,
}: EstablishmentFormProps) {
  const { profile } = useAuthStore()
  const [form, setForm] = useState<Partial<Establishment>>(
    establishment ? { ...establishment } : { ...emptyEstablishment }
  )
  const [saving, setSaving] = useState(false)

  const isEditing = !!establishment?.id

  const handleSave = async () => {
    if (!profile?.organization_id || !form.nombre?.trim()) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      nombre: form.nombre!.trim(),
      direccion: form.direccion || null,
      localidad: form.localidad || null,
      provincia: form.provincia || null,
      codigo_postal: form.codigo_postal || null,
      telefono: form.telefono || null,
      email: form.email || null,
      contacto_nombre: form.contacto_nombre || null,
      actividad_principal: form.actividad_principal || null,
      ciiu: form.ciiu || null,
      superficie_total_m2: form.superficie_total_m2 || null,
      cantidad_personal: form.cantidad_personal || 0,
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      const { error } = await supabase
        .from("establishments")
        .update(payload)
        .eq("id", establishment.id)
      if (error) {
        toast.error("Error al actualizar establecimiento")
        setSaving(false)
        return
      }
      toast.success("Establecimiento actualizado")
    } else {
      const { error } = await supabase.from("establishments").insert({
        ...payload,
        organization_id: profile.organization_id,
        client_id: clientId,
      })
      if (error) {
        toast.error("Error al crear establecimiento")
        setSaving(false)
        return
      }
      toast.success("Establecimiento creado")
    }

    setSaving(false)
    onOpenChange(false)
    onSaved()
  }

  const update = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form when dialog opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm(establishment ? { ...establishment } : { ...emptyEstablishment })
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar establecimiento" : "Nuevo establecimiento"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Planta Industrial San Martín"
                value={form.nombre || ""}
                onChange={(e) => update("nombre", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Actividad principal</Label>
              <Input
                placeholder="Ej: Metalúrgica, Alimenticia"
                value={form.actividad_principal || ""}
                onChange={(e) => update("actividad_principal", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>CIIU</Label>
              <Input
                placeholder="Código CIIU"
                value={form.ciiu || ""}
                onChange={(e) => update("ciiu", e.target.value)}
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
              <Label>Superficie total (m²)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.superficie_total_m2 ?? ""}
                onChange={(e) =>
                  update(
                    "superficie_total_m2",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input
                value={form.telefono || ""}
                onChange={(e) => update("telefono", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={form.direccion || ""}
                onChange={(e) => update("direccion", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Localidad</Label>
              <Input
                value={form.localidad || ""}
                onChange={(e) => update("localidad", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Provincia</Label>
              <Select
                value={form.provincia || "Buenos Aires"}
                onValueChange={(v) => update("provincia", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Código postal</Label>
              <Input
                value={form.codigo_postal || ""}
                onChange={(e) => update("codigo_postal", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Contacto</Label>
              <Input
                placeholder="Nombre del contacto en el establecimiento"
                value={form.contacto_nombre || ""}
                onChange={(e) => update("contacto_nombre", e.target.value)}
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

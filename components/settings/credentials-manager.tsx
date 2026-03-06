"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { differenceInDays } from "date-fns"
import type { ProfessionalCredential, CredentialType } from "@/lib/crm-types"
import { CREDENTIAL_TYPES } from "@/lib/crm-types"

const emptyCredential: Partial<ProfessionalCredential> = {
  tipo: "matricula_provincial",
  numero: "",
  jurisdiccion: "",
  entidad_emisora: "",
  fecha_emision: null,
  fecha_vencimiento: null,
  is_primary: false,
}

export function CredentialsManager() {
  const { profile } = useAuthStore()
  const [credentials, setCredentials] = useState<ProfessionalCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<Partial<ProfessionalCredential>>({
    ...emptyCredential,
  })
  const [saving, setSaving] = useState(false)

  const loadCredentials = useCallback(async () => {
    if (!profile?.id) return
    const supabase = createClient()
    const { data } = await supabase
      .from("professional_credentials")
      .select("*")
      .eq("profile_id", profile.id)
      .order("is_primary", { ascending: false })
      .order("created_at")
    setCredentials((data as ProfessionalCredential[]) || [])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  const handleSave = async () => {
    if (!profile?.id || !profile?.organization_id || !form.numero?.trim())
      return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      tipo: form.tipo || "matricula_provincial",
      numero: form.numero!.trim(),
      jurisdiccion: form.jurisdiccion || null,
      entidad_emisora: form.entidad_emisora || null,
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      is_primary: form.is_primary || false,
      updated_at: new Date().toISOString(),
    }

    if (form.id) {
      const { error } = await supabase
        .from("professional_credentials")
        .update(payload)
        .eq("id", form.id)
      if (error) {
        toast.error("Error al actualizar credencial")
        setSaving(false)
        return
      }
      toast.success("Credencial actualizada")
    } else {
      // If this is the first credential, make it primary
      const isPrimary = credentials.length === 0 ? true : payload.is_primary
      const { error } = await supabase
        .from("professional_credentials")
        .insert({
          ...payload,
          is_primary: isPrimary,
          profile_id: profile.id,
          organization_id: profile.organization_id,
        })
      if (error) {
        toast.error("Error al crear credencial")
        setSaving(false)
        return
      }
      toast.success("Credencial creada")
    }

    setSaving(false)
    setDialogOpen(false)
    loadCredentials()
  }

  const handleDelete = async (id: string) => {
    const cred = credentials.find((c) => c.id === id)
    if (cred?.is_primary && credentials.length > 1) {
      toast.error("No se puede eliminar la credencial principal. Marcá otra como principal primero.")
      return
    }
    const supabase = createClient()
    const { error } = await supabase
      .from("professional_credentials")
      .delete()
      .eq("id", id)
    if (error) {
      toast.error("Error al eliminar credencial")
      return
    }
    toast.success("Credencial eliminada")
    loadCredentials()
  }

  const handleSetPrimary = async (id: string) => {
    if (!profile?.id) return
    const supabase = createClient()
    // Unset all primary
    await supabase
      .from("professional_credentials")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("profile_id", profile.id)
    // Set the selected one
    const { error } = await supabase
      .from("professional_credentials")
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      toast.error("Error al actualizar credencial principal")
      return
    }
    toast.success("Credencial principal actualizada")
    loadCredentials()
  }

  const openEdit = (cred: ProfessionalCredential) => {
    setForm({ ...cred })
    setDialogOpen(true)
  }

  const openNew = () => {
    setForm({ ...emptyCredential })
    setDialogOpen(true)
  }

  const getStatusBadge = (cred: ProfessionalCredential) => {
    if (!cred.fecha_vencimiento) return null
    const days = differenceInDays(
      new Date(cred.fecha_vencimiento),
      new Date()
    )
    if (days < 0)
      return (
        <Badge variant="destructive" className="text-xs">
          Vencida
        </Badge>
      )
    if (days < 30)
      return (
        <Badge
          variant="outline"
          className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400"
        >
          Vence en {days}d
        </Badge>
      )
    return (
      <Badge
        variant="outline"
        className="text-xs border-green-500 text-green-700 dark:text-green-400"
      >
        Vigente
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Matrículas y Credenciales</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestioná tus matrículas profesionales y registros habilitantes.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Cargando credenciales...
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 border border-border rounded-xl">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay credenciales registradas
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agregá tu matrícula profesional para incluirla en los informes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {CREDENTIAL_TYPES[cred.tipo]?.label || cred.tipo}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    #{cred.numero}
                  </span>
                  {cred.is_primary && (
                    <Badge
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      <Star className="h-3 w-3" />
                      Principal
                    </Badge>
                  )}
                  {getStatusBadge(cred)}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  {cred.jurisdiccion && <span>{cred.jurisdiccion}</span>}
                  {cred.entidad_emisora && <span>{cred.entidad_emisora}</span>}
                  {cred.fecha_vencimiento && (
                    <span>
                      Vence: {new Date(cred.fecha_vencimiento).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(cred)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {!cred.is_primary && (
                    <DropdownMenuItem onClick={() => handleSetPrimary(cred.id)}>
                      <Star className="h-3.5 w-3.5 mr-2" />
                      Marcar como principal
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDelete(cred.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Credential Form Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setForm(form.id ? { ...form } : { ...emptyCredential })
          setDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar credencial" : "Nueva credencial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={form.tipo || "matricula_provincial"}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, tipo: v as CredentialType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CREDENTIAL_TYPES).map(([k, { label }]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Número *</Label>
                <Input
                  placeholder="Ej: 12345"
                  value={form.numero || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, numero: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Jurisdicción</Label>
                <Input
                  placeholder="Ej: Buenos Aires"
                  value={form.jurisdiccion || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, jurisdiccion: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entidad emisora</Label>
                <Input
                  placeholder="Ej: COPIME"
                  value={form.entidad_emisora || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, entidad_emisora: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de emisión</Label>
                <Input
                  type="date"
                  value={form.fecha_emision || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fecha_emision: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de vencimiento</Label>
                <Input
                  type="date"
                  value={form.fecha_vencimiento || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fecha_vencimiento: e.target.value || null,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.numero?.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {form.id ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

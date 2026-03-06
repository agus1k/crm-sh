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
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { AnnualPlan, Client, Establishment, PlanStatus } from "@/lib/crm-types"
import { PLAN_STATUSES } from "@/lib/crm-types"
import { toast } from "sonner"

interface PlanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: AnnualPlan | null
  onSaved: () => void
}

export function PlanForm({ open, onOpenChange, plan, onSaved }: PlanFormProps) {
  const { profile } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)

  const [clientId, setClientId] = useState(plan?.client_id || "")
  const [establishmentId, setEstablishmentId] = useState(plan?.establishment_id || "")
  const [anio, setAnio] = useState(plan?.anio || new Date().getFullYear())
  const [titulo, setTitulo] = useState(plan?.titulo || "")
  const [descripcion, setDescripcion] = useState(plan?.descripcion || "")
  const [status, setStatus] = useState<PlanStatus>(plan?.status || "borrador")

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      setClientId(plan.client_id)
      setEstablishmentId(plan.establishment_id || "")
      setAnio(plan.anio)
      setTitulo(plan.titulo)
      setDescripcion(plan.descripcion || "")
      setStatus(plan.status)
    } else {
      setClientId("")
      setEstablishmentId("")
      setAnio(new Date().getFullYear())
      setTitulo("")
      setDescripcion("")
      setStatus("borrador")
    }
  }, [plan, open])

  // Load clients
  useEffect(() => {
    if (!profile?.organization_id || !open) return
    const load = async () => {
      setLoadingClients(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("razon_social")
      setClients((data as Client[]) || [])
      setLoadingClients(false)
    }
    load()
  }, [profile?.organization_id, open])

  // Load establishments when client changes
  useEffect(() => {
    if (!clientId) {
      setEstablishments([])
      setEstablishmentId("")
      return
    }
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("establishments")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("nombre")
      setEstablishments((data as Establishment[]) || [])
    }
    load()
  }, [clientId])

  // Auto-generate title
  useEffect(() => {
    if (plan) return // Don't auto-generate when editing
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setTitulo(`Plan Anual ${anio} - ${client.razon_social}`)
    }
  }, [clientId, anio, clients, plan])

  const handleSave = async () => {
    if (!profile?.organization_id || !clientId || !titulo) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      organization_id: profile.organization_id,
      client_id: clientId,
      establishment_id: establishmentId || null,
      anio,
      titulo,
      descripcion: descripcion || null,
      status,
      created_by: profile.id,
    }

    if (plan?.id) {
      const { created_by: _, ...updatePayload } = payload
      const { error } = await supabase
        .from("annual_plans")
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq("id", plan.id)
      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un plan para este cliente/establecimiento/año")
        } else {
          toast.error("Error al actualizar plan")
        }
        setSaving(false)
        return
      }
      toast.success("Plan actualizado")
    } else {
      const { error } = await supabase.from("annual_plans").insert(payload)
      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un plan para este cliente/establecimiento/año")
        } else {
          toast.error("Error al crear plan")
        }
        setSaving(false)
        return
      }
      toast.success("Plan creado")
    }
    setSaving(false)
    onOpenChange(false)
    onSaved()
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plan anual" : "Nuevo plan anual"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select
              value={clientId}
              onValueChange={(val) => setClientId(val)}
              disabled={!!plan || loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {establishments.length > 0 && (
            <div className="space-y-1.5">
              <Label>Establecimiento</Label>
              <Select
                value={establishmentId || "none"}
                onValueChange={(val) => setEstablishmentId(val === "none" ? "" : val)}
                disabled={!!plan}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los establecimientos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los establecimientos</SelectItem>
                  {establishments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Año *</Label>
              <Select
                value={anio.toString()}
                onValueChange={(val) => setAnio(parseInt(val))}
                disabled={!!plan}
              >
                <SelectTrigger>
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

            {plan && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as PlanStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Plan Anual 2026 - Empresa SA"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Observaciones sobre el plan..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !clientId || !titulo}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {plan ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

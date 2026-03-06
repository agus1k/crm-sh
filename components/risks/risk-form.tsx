"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Client, Establishment, DBSector } from "@/lib/crm-types"

interface RiskFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (id: string) => void
}

export function RiskForm({ open, onOpenChange, onCreated }: RiskFormProps) {
  const { profile } = useAuthStore()

  const [saving, setSaving] = useState(false)
  const [loadingRef, setLoadingRef] = useState(true)

  // Reference data
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [sectors, setSectors] = useState<DBSector[]>([])

  // Form fields
  const [titulo, setTitulo] = useState("")
  const [clientId, setClientId] = useState("")
  const [establishmentId, setEstablishmentId] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [notas, setNotas] = useState("")

  // Load clients
  const loadClients = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoadingRef(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("razon_social")

    setClients((data as Client[]) || [])
    setLoadingRef(false)
  }, [profile?.organization_id])

  useEffect(() => {
    if (open) loadClients()
  }, [open, loadClients])

  // Load establishments when client changes
  useEffect(() => {
    if (!clientId || !profile?.organization_id) {
      setEstablishments([])
      setEstablishmentId("")
      setSectors([])
      setSectorId("")
      return
    }
    const supabase = createClient()
    supabase
      .from("establishments")
      .select("*")
      .eq("client_id", clientId)
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("nombre")
      .then(({ data }) => {
        setEstablishments((data as Establishment[]) || [])
      })
  }, [clientId, profile?.organization_id])

  // Load sectors when establishment changes
  useEffect(() => {
    if (!establishmentId || !profile?.organization_id) {
      setSectors([])
      setSectorId("")
      return
    }
    const supabase = createClient()
    supabase
      .from("sectors")
      .select("*")
      .eq("establishment_id", establishmentId)
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("nombre")
      .then(({ data }) => {
        setSectors((data as DBSector[]) || [])
      })
  }, [establishmentId, profile?.organization_id])

  const resetForm = () => {
    setTitulo("")
    setClientId("")
    setEstablishmentId("")
    setSectorId("")
    setFecha(new Date().toISOString().split("T")[0])
    setNotas("")
  }

  const handleSubmit = async () => {
    if (!profile?.organization_id || !profile?.id) return
    if (!titulo.trim() || !clientId || !establishmentId) return

    setSaving(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("risk_assessments")
        .insert({
          organization_id: profile.organization_id,
          profesional_id: profile.id,
          titulo: titulo.trim(),
          client_id: clientId,
          establishment_id: establishmentId,
          sector_id: sectorId || null,
          fecha,
          notas: notas.trim() || null,
          status: "borrador",
        })
        .select("id")
        .single()

      if (error) throw error

      toast.success("Relevamiento de riesgos creado correctamente")
      onCreated(data.id)
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Error al crear el relevamiento")
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = titulo.trim().length > 0 && clientId && establishmentId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Relevamiento de Riesgos</DialogTitle>
        </DialogHeader>

        {loadingRef ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando datos...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Título *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Relevamiento general - Planta Norte"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
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

            <div className="space-y-1.5">
              <Label className="text-sm">Establecimiento *</Label>
              <Select
                value={establishmentId}
                onValueChange={setEstablishmentId}
                disabled={!clientId || establishments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !clientId
                        ? "Seleccione un cliente primero"
                        : establishments.length === 0
                          ? "Sin establecimientos"
                          : "Seleccionar establecimiento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Sector (opcional)</Label>
              <Select
                value={sectorId}
                onValueChange={setSectorId}
                disabled={!establishmentId || sectors.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !establishmentId
                        ? "Seleccione un establecimiento primero"
                        : sectors.length === 0
                          ? "Sin sectores"
                          : "Seleccionar sector"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sector específico</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Notas (opcional)</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones generales del relevamiento..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Crear relevamiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

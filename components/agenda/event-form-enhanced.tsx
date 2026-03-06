"use client"

import { useEffect, useState, useCallback } from "react"
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
import type {
  EnhancedCalendarEvent,
  EventType,
  EventRecurrence,
  Client,
  Establishment,
  Profile,
} from "@/lib/crm-types"
import { EVENT_TYPES, EVENT_RECURRENCES } from "@/lib/crm-types"

interface EventFormEnhancedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: EnhancedCalendarEvent | null
  defaultDate?: string
  onSaved: () => void
}

export function EventFormEnhanced({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSaved,
}: EventFormEnhancedProps) {
  const { profile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [members, setMembers] = useState<Profile[]>([])

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState<EventType>("reunion")
  const [eventDate, setEventDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [clientId, setClientId] = useState("")
  const [establishmentId, setEstablishmentId] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [recurrence, setRecurrence] = useState<EventRecurrence>("none")

  const isEdit = !!event

  // Load options
  const loadOptions = useCallback(async () => {
    if (!profile?.organization_id) return
    const supabase = createClient()
    const orgId = profile.organization_id

    const [clientRes, memberRes] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
      supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", orgId)
        .order("full_name"),
    ])

    setClients((clientRes.data as Client[]) || [])
    setMembers((memberRes.data as Profile[]) || [])
  }, [profile?.organization_id])

  // Load establishments when client changes
  const loadEstablishments = useCallback(
    async (cId: string) => {
      if (!cId || cId === "none") {
        setEstablishments([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from("establishments")
        .select("*")
        .eq("client_id", cId)
        .eq("is_active", true)
        .order("nombre")
      setEstablishments((data as Establishment[]) || [])
    },
    []
  )

  // Reset form when dialog opens/event changes
  useEffect(() => {
    if (open) {
      loadOptions()
      if (event) {
        setTitle(event.title)
        setDescription(event.description || "")
        setEventType(event.event_type)
        setEventDate(event.event_date.slice(0, 16))
        setEndDate(event.end_date ? event.end_date.slice(0, 16) : "")
        setClientId(event.client_id || "")
        setEstablishmentId(event.establishment_id || "")
        setAssignedTo(event.assigned_to || "")
        setRecurrence(event.recurrence || "none")
        if (event.client_id) loadEstablishments(event.client_id)
      } else {
        setTitle("")
        setDescription("")
        setEventType("reunion")
        setEventDate(
          defaultDate || new Date().toISOString().slice(0, 16)
        )
        setEndDate("")
        setClientId("")
        setEstablishmentId("")
        setAssignedTo("")
        setRecurrence("none")
        setEstablishments([])
      }
    }
  }, [open, event, defaultDate, loadOptions, loadEstablishments])

  const handleClientChange = (val: string) => {
    const cId = val === "none" ? "" : val
    setClientId(cId)
    setEstablishmentId("")
    loadEstablishments(cId)
  }

  const handleSave = async () => {
    if (!profile?.organization_id || !title.trim() || !eventDate) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      organization_id: profile.organization_id,
      title: title.trim(),
      description: description.trim() || null,
      event_type: eventType,
      event_date: new Date(eventDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      client_id: clientId || null,
      establishment_id: establishmentId || null,
      assigned_to: assignedTo || null,
      recurrence,
      created_by: profile.id,
      status: event?.status || "planificado",
    }

    let error
    if (isEdit) {
      const { error: e } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id)
      error = e
    } else {
      const { error: e } = await supabase.from("events").insert(payload)
      error = e
    }

    if (error) {
      toast.error(isEdit ? "Error al actualizar evento" : "Error al crear evento")
      setSaving(false)
      return
    }

    toast.success(isEdit ? "Evento actualizado" : "Evento creado")
    setSaving(false)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titulo *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Inspección planta baja"
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select
                value={eventType}
                onValueChange={(v) => setEventType(v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recurrencia</Label>
              <Select
                value={recurrence}
                onValueChange={(v) => setRecurrence(v as EventRecurrence)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_RECURRENCES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha inicio *</Label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha fin</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select
              value={clientId || "none"}
              onValueChange={handleClientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Establishment (only if client selected) */}
          {clientId && establishments.length > 0 && (
            <div className="space-y-1.5">
              <Label>Establecimiento</Label>
              <Select
                value={establishmentId || "none"}
                onValueChange={(v) =>
                  setEstablishmentId(v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin establecimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin establecimiento</SelectItem>
                  {establishments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assigned to */}
          <div className="space-y-1.5">
            <Label>Asignado a</Label>
            <Select
              value={assignedTo || "none"}
              onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descripcion</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del evento..."
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
            disabled={saving || !title.trim() || !eventDate}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? "Guardar cambios" : "Crear evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

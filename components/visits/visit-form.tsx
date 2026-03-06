"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge"
import {
  ObservationInlineForm,
  type InlineObservation,
} from "./observation-inline-form"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type {
  Client,
  Establishment,
  DBSector,
  Visit,
} from "@/lib/crm-types"

interface VisitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visit?: Visit | null
  onSaved: () => void
}

const STEPS = [
  { id: 1, label: "Cliente", icon: Building2 },
  { id: 2, label: "Detalles", icon: FileText },
  { id: 3, label: "Observaciones", icon: AlertTriangle },
  { id: 4, label: "Acciones", icon: CheckCircle2 },
  { id: 5, label: "Resumen", icon: MapPin },
]

export function VisitForm({
  open,
  onOpenChange,
  visit,
  onSaved,
}: VisitFormProps) {
  const { profile } = useAuthStore()
  const isEditing = !!visit

  // Step state
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Reference data
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [sectors, setSectors] = useState<DBSector[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  // Form data
  const [clientId, setClientId] = useState("")
  const [establishmentId, setEstablishmentId] = useState("")
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [motivo, setMotivo] = useState("")
  const [horaIngreso, setHoraIngreso] = useState("")
  const [horaEgreso, setHoraEgreso] = useState("")
  const [acompanante, setAcompanante] = useState("")
  const [observations, setObservations] = useState<InlineObservation[]>([])
  const [accionesRealizadas, setAccionesRealizadas] = useState("")

  // Load reference data
  const loadRefData = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoadingRef(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("razon_social")

    setClients((clientData as Client[]) || [])
    setLoadingRef(false)
  }, [profile?.organization_id])

  useEffect(() => {
    if (open) loadRefData()
  }, [open, loadRefData])

  // Load establishments when client changes
  useEffect(() => {
    if (!clientId || !profile?.organization_id) {
      setEstablishments([])
      setEstablishmentId("")
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

  // Populate form when editing
  useEffect(() => {
    if (visit && open) {
      setClientId(visit.client_id)
      setEstablishmentId(visit.establishment_id)
      setFecha(visit.fecha)
      setMotivo(visit.motivo)
      setHoraIngreso(visit.hora_ingreso || "")
      setHoraEgreso(visit.hora_egreso || "")
      setAcompanante(visit.acompanante || "")
      setAccionesRealizadas(visit.acciones_realizadas || "")
      // Load existing observations
      const supabase = createClient()
      supabase
        .from("visit_observations")
        .select("*")
        .eq("visit_id", visit.id)
        .order("created_at")
        .then(({ data }) => {
          if (data) {
            setObservations(
              data.map((o: any) => ({
                id: o.id,
                tipo: o.tipo,
                descripcion: o.descripcion,
                sector_id: o.sector_id,
                prioridad: o.prioridad,
                foto_url: o.foto_url,
              }))
            )
          }
        })
      setStep(1)
    } else if (!visit && open) {
      resetForm()
    }
  }, [visit, open])

  const resetForm = () => {
    setStep(1)
    setClientId("")
    setEstablishmentId("")
    setFecha(new Date().toISOString().split("T")[0])
    setMotivo("")
    setHoraIngreso("")
    setHoraEgreso("")
    setAcompanante("")
    setObservations([])
    setAccionesRealizadas("")
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return clientId && establishmentId && fecha
      case 2:
        return motivo.trim().length > 0
      case 3:
        return observations.every((o) => o.descripcion.trim().length > 0)
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSave = async () => {
    if (!profile?.organization_id || !profile?.id) return
    setSaving(true)

    try {
      const supabase = createClient()
      const orgId = profile.organization_id

      const visitData = {
        organization_id: orgId,
        client_id: clientId,
        establishment_id: establishmentId,
        fecha,
        hora_ingreso: horaIngreso || null,
        hora_egreso: horaEgreso || null,
        motivo,
        profesional_id: profile.id,
        acompanante: acompanante || null,
        acciones_realizadas: accionesRealizadas || null,
        status: "borrador" as const,
      }

      let visitId: string

      if (isEditing) {
        const { error } = await supabase
          .from("visits")
          .update(visitData)
          .eq("id", visit!.id)
        if (error) throw error
        visitId = visit!.id

        // Delete old observations (will re-insert)
        await supabase
          .from("visit_observations")
          .delete()
          .eq("visit_id", visitId)

        // Delete old central observations linked to this visit
        await supabase
          .from("observations")
          .delete()
          .eq("source_type", "visita")
          .eq("source_id", visitId)
      } else {
        const { data, error } = await supabase
          .from("visits")
          .insert(visitData)
          .select("id")
          .single()
        if (error) throw error
        visitId = data.id
      }

      // Insert visit observations + central observations
      if (observations.length > 0) {
        const visitObs = observations.map((o) => ({
          visit_id: visitId,
          organization_id: orgId,
          tipo: o.tipo,
          descripcion: o.descripcion,
          sector_id: o.sector_id,
          prioridad: o.prioridad,
          foto_url: o.foto_url,
        }))

        const { data: insertedObs, error: obsError } = await supabase
          .from("visit_observations")
          .insert(visitObs)
          .select("id, tipo, descripcion, sector_id, prioridad")

        if (obsError) throw obsError

        // Auto-create central observations for each visit observation
        if (insertedObs && insertedObs.length > 0) {
          const centralObs = insertedObs.map((o: any) => ({
            organization_id: orgId,
            client_id: clientId,
            establishment_id: establishmentId,
            sector_id: o.sector_id,
            source_type: "visita" as const,
            source_id: visitId,
            titulo: `${o.tipo === "no_conformidad" ? "No Conformidad" : o.tipo.charAt(0).toUpperCase() + o.tipo.slice(1)} - Visita ${fecha}`,
            descripcion: o.descripcion,
            tipo: o.tipo,
            prioridad: o.prioridad,
            status: "abierta" as const,
            created_by: profile.id,
          }))

          await supabase.from("observations").insert(centralObs)
        }
      }

      toast.success(
        isEditing
          ? "Visita actualizada correctamente"
          : "Visita registrada correctamente"
      )
      onSaved()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la visita")
    } finally {
      setSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedEstablishment = establishments.find(
    (e) => e.id === establishmentId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Visita" : "Nueva Visita"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id)
                }}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors w-full",
                  step === s.id
                    ? "bg-primary/10 text-primary"
                    : s.id < step
                      ? "text-muted-foreground hover:text-foreground cursor-pointer"
                      : "text-muted-foreground/50"
                )}
                disabled={s.id > step}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 shrink-0 mx-0.5",
                    s.id < step ? "bg-primary/30" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {loadingRef ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando datos...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Client + Establishment + Date */}
            {step === 1 && (
              <div className="space-y-4">
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
                  <Label className="text-sm">Fecha de visita *</Label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Visit details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Motivo de la visita *</Label>
                  <Textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Inspección de rutina, relevamiento de riesgos, seguimiento de observaciones..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Hora de ingreso</Label>
                    <Input
                      type="time"
                      value={horaIngreso}
                      onChange={(e) => setHoraIngreso(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Hora de egreso</Label>
                    <Input
                      type="time"
                      value={horaEgreso}
                      onChange={(e) => setHoraEgreso(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Acompañante</Label>
                  <Input
                    value={acompanante}
                    onChange={(e) => setAcompanante(e.target.value)}
                    placeholder="Nombre de quien acompañó la visita"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Observations */}
            {step === 3 && (
              <ObservationInlineForm
                observations={observations}
                sectors={sectors}
                onChange={setObservations}
              />
            )}

            {/* Step 4: Actions taken */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Acciones realizadas</Label>
                  <Textarea
                    value={accionesRealizadas}
                    onChange={(e) => setAccionesRealizadas(e.target.value)}
                    placeholder="Describa las acciones tomadas durante la visita, recomendaciones verbales, capacitaciones realizadas, etc."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <h3 className="font-semibold text-sm">
                    Resumen de la visita
                  </h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Cliente
                      </span>
                      <p className="font-medium">
                        {selectedClient?.razon_social || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Establecimiento
                      </span>
                      <p className="font-medium">
                        {selectedEstablishment?.nombre || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Fecha
                      </span>
                      <p className="font-medium">{fecha}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Horario
                      </span>
                      <p className="font-medium">
                        {horaIngreso || "--:--"} — {horaEgreso || "--:--"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-xs">
                      Motivo
                    </span>
                    <p className="text-sm">{motivo}</p>
                  </div>

                  {acompanante && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Acompañante
                      </span>
                      <p className="text-sm">{acompanante}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground text-xs">
                      Observaciones
                    </span>
                    <p className="text-sm font-medium">
                      {observations.length} registradas
                    </p>
                  </div>

                  {accionesRealizadas && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Acciones realizadas
                      </span>
                      <p className="text-sm line-clamp-3">
                        {accionesRealizadas}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  La visita se guardará con estado <strong>Borrador</strong>.
                  Podrá firmarla y enviarla desde la vista de detalle.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  disabled={!canProceed()}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isEditing ? "Actualizar" : "Guardar visita"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

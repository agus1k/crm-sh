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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  User,
  HeartPulse,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type {
  Incident,
  IncidentTipo,
  IncidentGravedad,
  Client,
  Establishment,
  DBSector,
} from "@/lib/crm-types"
import {
  INCIDENT_TIPOS,
  INCIDENT_GRAVEDADES,
  INCIDENT_GRAVEDAD_COLORS,
} from "@/lib/crm-types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncidentFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (id: string) => void
  incident?: Incident | null
}

const STEPS = [
  { id: 1, label: "Datos Básicos", icon: ClipboardList },
  { id: 2, label: "Persona Afectada", icon: User },
  { id: 3, label: "Consecuencia", icon: HeartPulse },
  { id: 4, label: "Resumen", icon: CheckCircle2 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IncidentForm({
  open,
  onOpenChange,
  onCreated,
  incident,
}: IncidentFormProps) {
  const { profile } = useAuthStore()
  const isEditing = !!incident

  // Step
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Reference data
  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [sectors, setSectors] = useState<DBSector[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  // Step 1 – Datos Básicos
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [hora, setHora] = useState("")
  const [tipo, setTipo] = useState<IncidentTipo | "">("")
  const [clientId, setClientId] = useState("")
  const [establishmentId, setEstablishmentId] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [lugarExacto, setLugarExacto] = useState("")

  // Step 2 – Persona Afectada
  const [nombreAfectado, setNombreAfectado] = useState("")
  const [puestoAfectado, setPuestoAfectado] = useState("")
  const [antiguedadMeses, setAntiguedadMeses] = useState<number | "">("")

  // Step 3 – Consecuencia
  const [tipoLesion, setTipoLesion] = useState("")
  const [parteCuerpo, setParteCuerpo] = useState("")
  const [gravedad, setGravedad] = useState<IncidentGravedad | "">("")
  const [diasPerdidos, setDiasPerdidos] = useState<number>(0)
  const [requirioHospitalizacion, setRequirioHospitalizacion] = useState(false)

  // ---------------------------------------------------------------------------
  // Load reference data
  // ---------------------------------------------------------------------------

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

  // Populate form when editing
  useEffect(() => {
    if (incident && open) {
      setFecha(incident.fecha)
      setHora(incident.hora || "")
      setTipo(incident.tipo)
      setClientId(incident.client_id)
      setEstablishmentId(incident.establishment_id)
      setSectorId(incident.sector_id || "")
      setDescripcion(incident.descripcion)
      setLugarExacto(incident.lugar_exacto || "")
      setNombreAfectado(incident.nombre_afectado || "")
      setPuestoAfectado(incident.puesto_afectado || "")
      setAntiguedadMeses(incident.antiguedad_meses ?? "")
      setTipoLesion(incident.tipo_lesion || "")
      setParteCuerpo(incident.parte_cuerpo || "")
      setGravedad(incident.gravedad || "")
      setDiasPerdidos(incident.dias_perdidos)
      setRequirioHospitalizacion(incident.requirio_hospitalizacion)
      setStep(1)
    } else if (!incident && open) {
      resetForm()
    }
  }, [incident, open])

  const resetForm = () => {
    setStep(1)
    setFecha(new Date().toISOString().split("T")[0])
    setHora("")
    setTipo("")
    setClientId("")
    setEstablishmentId("")
    setSectorId("")
    setDescripcion("")
    setLugarExacto("")
    setNombreAfectado("")
    setPuestoAfectado("")
    setAntiguedadMeses("")
    setTipoLesion("")
    setParteCuerpo("")
    setGravedad("")
    setDiasPerdidos(0)
    setRequirioHospitalizacion(false)
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          fecha &&
          tipo &&
          clientId &&
          establishmentId &&
          descripcion.trim().length > 0
        )
      case 2:
        return true // all optional
      case 3:
        return true // all optional
      case 4:
        return true
      default:
        return false
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!profile?.organization_id || !profile?.id) return
    setSaving(true)

    try {
      const supabase = createClient()
      const orgId = profile.organization_id

      const incidentData = {
        organization_id: orgId,
        client_id: clientId,
        establishment_id: establishmentId,
        sector_id: sectorId || null,
        fecha,
        hora: hora || null,
        tipo: tipo as IncidentTipo,
        descripcion,
        lugar_exacto: lugarExacto || null,
        nombre_afectado: nombreAfectado || null,
        puesto_afectado: puestoAfectado || null,
        antiguedad_meses:
          antiguedadMeses !== "" ? Number(antiguedadMeses) : null,
        tipo_lesion: tipoLesion || null,
        parte_cuerpo: parteCuerpo || null,
        gravedad: (gravedad as IncidentGravedad) || null,
        dias_perdidos: diasPerdidos,
        requirio_hospitalizacion: requirioHospitalizacion,
        status: "reportado" as const,
      }

      let resultId: string

      if (isEditing) {
        const { error } = await supabase
          .from("incidents")
          .update(incidentData)
          .eq("id", incident!.id)
        if (error) throw error
        resultId = incident!.id
      } else {
        const { data, error } = await supabase
          .from("incidents")
          .insert(incidentData)
          .select("id")
          .single()
        if (error) throw error
        resultId = data.id
      }

      toast.success(
        isEditing
          ? "Incidente actualizado correctamente"
          : "Incidente registrado correctamente"
      )
      onCreated(resultId)
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el incidente")
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived data for summary
  // ---------------------------------------------------------------------------

  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedEstablishment = establishments.find(
    (e) => e.id === establishmentId
  )
  const selectedSector = sectors.find((s) => s.id === sectorId)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Incidente" : "Nuevo Incidente"}
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
            {/* ============================================================ */}
            {/* Step 1: Datos Básicos                                        */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Fecha *</Label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Hora</Label>
                    <Input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Tipo *</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => setTipo(v as IncidentTipo)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(INCIDENT_TIPOS) as [
                          IncidentTipo,
                          string,
                        ][]
                      ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {sectors.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Sector</Label>
                    <Select value={sectorId} onValueChange={setSectorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sector (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm">Descripción del hecho *</Label>
                  <Textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describa detalladamente qué ocurrió, cómo, y en qué circunstancias..."
                    rows={4}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Lugar exacto</Label>
                  <Input
                    value={lugarExacto}
                    onChange={(e) => setLugarExacto(e.target.value)}
                    placeholder="Ej: Pasillo sector depósito, frente a estantería N° 3"
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* Step 2: Persona Afectada                                     */}
            {/* ============================================================ */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Datos de la persona involucrada en el hecho (todos los campos
                  son opcionales).
                </p>

                <div className="space-y-1.5">
                  <Label className="text-sm">Nombre del afectado</Label>
                  <Input
                    value={nombreAfectado}
                    onChange={(e) => setNombreAfectado(e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Puesto / Tarea</Label>
                  <Input
                    value={puestoAfectado}
                    onChange={(e) => setPuestoAfectado(e.target.value)}
                    placeholder="Ej: Operario de producción"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Antigüedad (meses)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={antiguedadMeses}
                    onChange={(e) =>
                      setAntiguedadMeses(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Meses en el puesto"
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* Step 3: Consecuencia                                         */}
            {/* ============================================================ */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Detalle las consecuencias del incidente.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Tipo de lesión</Label>
                    <Input
                      value={tipoLesion}
                      onChange={(e) => setTipoLesion(e.target.value)}
                      placeholder="Ej: Fractura, quemadura"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Parte del cuerpo</Label>
                    <Input
                      value={parteCuerpo}
                      onChange={(e) => setParteCuerpo(e.target.value)}
                      placeholder="Ej: Mano derecha"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Gravedad</Label>
                  <Select
                    value={gravedad}
                    onValueChange={(v) => setGravedad(v as IncidentGravedad)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar gravedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(INCIDENT_GRAVEDADES) as [
                          IncidentGravedad,
                          string,
                        ][]
                      ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Días perdidos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={diasPerdidos}
                    onChange={(e) => setDiasPerdidos(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hospitalizacion"
                    checked={requirioHospitalizacion}
                    onCheckedChange={(checked) =>
                      setRequirioHospitalizacion(checked === true)
                    }
                  />
                  <Label htmlFor="hospitalizacion" className="text-sm">
                    Requirió hospitalización
                  </Label>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* Step 4: Resumen                                              */}
            {/* ============================================================ */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-4 space-y-3">
                  <h3 className="font-semibold text-sm">
                    Resumen del incidente
                  </h3>

                  {/* Basic data */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Fecha
                      </span>
                      <p className="font-medium">
                        {format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Hora
                      </span>
                      <p className="font-medium">{hora || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Tipo
                      </span>
                      <p className="font-medium">
                        {tipo ? INCIDENT_TIPOS[tipo as IncidentTipo] : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Cliente
                      </span>
                      <p className="font-medium">
                        {selectedClient?.razon_social || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Establecimiento
                      </span>
                      <p className="font-medium">
                        {selectedEstablishment?.nombre || "—"}
                      </p>
                    </div>
                    {selectedSector && (
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Sector
                        </span>
                        <p className="font-medium">{selectedSector.nombre}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-muted-foreground text-xs">
                      Descripción
                    </span>
                    <p className="text-sm line-clamp-3">{descripcion}</p>
                  </div>

                  {lugarExacto && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Lugar exacto
                      </span>
                      <p className="text-sm">{lugarExacto}</p>
                    </div>
                  )}

                  {/* Person */}
                  {(nombreAfectado || puestoAfectado) && (
                    <>
                      <hr className="border-border" />
                      <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Persona afectada
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {nombreAfectado && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Nombre
                            </span>
                            <p className="font-medium">{nombreAfectado}</p>
                          </div>
                        )}
                        {puestoAfectado && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Puesto
                            </span>
                            <p className="font-medium">{puestoAfectado}</p>
                          </div>
                        )}
                        {antiguedadMeses !== "" && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Antigüedad
                            </span>
                            <p className="font-medium">
                              {antiguedadMeses} meses
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Consequence */}
                  {(tipoLesion || parteCuerpo || gravedad) && (
                    <>
                      <hr className="border-border" />
                      <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        Consecuencia
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {tipoLesion && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Tipo de lesión
                            </span>
                            <p className="font-medium">{tipoLesion}</p>
                          </div>
                        )}
                        {parteCuerpo && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Parte del cuerpo
                            </span>
                            <p className="font-medium">{parteCuerpo}</p>
                          </div>
                        )}
                        {gravedad && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Gravedad
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                INCIDENT_GRAVEDAD_COLORS[
                                  gravedad as IncidentGravedad
                                ]
                              )}
                            >
                              {INCIDENT_GRAVEDADES[gravedad as IncidentGravedad]}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Días perdidos
                          </span>
                          <p className="font-medium">{diasPerdidos}</p>
                        </div>
                        {requirioHospitalizacion && (
                          <div>
                            <span className="text-muted-foreground text-xs">
                              Hospitalización
                            </span>
                            <p className="font-medium text-red-600 dark:text-red-400">
                              Sí
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  El incidente se guardará con estado{" "}
                  <strong>Reportado</strong>. Podrá iniciar la investigación
                  causal desde la vista de detalle.
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

              {step < 4 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
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
                  {isEditing ? "Actualizar" : "Guardar incidente"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type {
  Client,
  Establishment,
  Instrument,
  ProtocolType,
} from "@/lib/crm-types"
import { PROTOCOL_TYPES } from "@/lib/crm-types"

interface ProtocolFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

export function ProtocolForm({ open, onOpenChange, onCreated }: ProtocolFormProps) {
  const { profile } = useAuthStore()

  const [clients, setClients] = useState<Client[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])

  const [tipo, setTipo] = useState<ProtocolType | "">("")
  const [clientId, setClientId] = useState("")
  const [establishmentId, setEstablishmentId] = useState("")
  const [instrumentId, setInstrumentId] = useState("")
  const [fechaMedicion, setFechaMedicion] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [condiciones, setCondiciones] = useState("")
  const [notas, setNotas] = useState("")

  const [creating, setCreating] = useState(false)
  const [calibrationValid, setCalibrationValid] = useState<boolean | null>(null)
  const [checkingCalibration, setCheckingCalibration] = useState(false)

  // Load clients, establishments, instruments
  useEffect(() => {
    if (!open || !profile?.organization_id) return

    const supabase = createClient()
    const orgId = profile.organization_id

    Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("razon_social"),
      supabase
        .from("establishments")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("nombre"),
      supabase
        .from("instruments")
        .select("*")
        .eq("organization_id", orgId)
        .order("nombre"),
    ]).then(([clientsRes, estRes, instRes]) => {
      setClients((clientsRes.data || []) as Client[])
      setEstablishments((estRes.data || []) as Establishment[])
      setInstruments((instRes.data || []) as Instrument[])
    })
  }, [open, profile?.organization_id])

  // Filter establishments by client
  const filteredEstablishments = useMemo(() => {
    if (!clientId) return []
    return establishments.filter((e) => e.client_id === clientId)
  }, [establishments, clientId])

  // Filter instruments by protocol type
  const filteredInstruments = useMemo(() => {
    if (!tipo) return instruments
    // Filter by instrument type matching the protocol type
    const typeMap: Record<string, string[]> = {
      iluminacion: ["luxometro"],
      ruido: ["decibelimetro", "dosimetro"],
      pat: ["telurimetro"],
    }
    const allowed = typeMap[tipo] || []
    if (allowed.length === 0) return instruments
    return instruments.filter((i) =>
      allowed.some((t) => i.tipo?.toLowerCase().includes(t))
    )
  }, [instruments, tipo])

  // Check instrument calibration when selected
  useEffect(() => {
    if (!instrumentId) {
      setCalibrationValid(null)
      return
    }

    setCheckingCalibration(true)
    const supabase = createClient()
    supabase
      .rpc("instrument_has_valid_calibration", {
        p_instrument_id: instrumentId,
      })
      .then(({ data, error }) => {
        setCheckingCalibration(false)
        if (error) {
          console.error("Calibration check error:", error)
          setCalibrationValid(null)
          return
        }
        setCalibrationValid(data === true)
      })
  }, [instrumentId])

  const resetForm = () => {
    setTipo("")
    setClientId("")
    setEstablishmentId("")
    setInstrumentId("")
    setFechaMedicion(new Date().toISOString().split("T")[0])
    setHoraInicio("")
    setHoraFin("")
    setCondiciones("")
    setNotas("")
    setCalibrationValid(null)
  }

  const handleCreate = async () => {
    if (
      !profile?.organization_id ||
      !tipo ||
      !clientId ||
      !establishmentId ||
      !instrumentId ||
      !fechaMedicion
    )
      return

    if (calibrationValid === false) {
      toast.error(
        "El instrumento no tiene calibración vigente. Actualice la calibración antes de crear el protocolo."
      )
      return
    }

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("measurement_protocols")
      .insert({
        organization_id: profile.organization_id,
        client_id: clientId,
        establishment_id: establishmentId,
        tipo,
        profesional_id: profile.id,
        instrument_id: instrumentId,
        fecha_medicion: fechaMedicion,
        hora_inicio: horaInicio || null,
        hora_fin: horaFin || null,
        condiciones_ambientales: condiciones || null,
        notas: notas || null,
        status: "borrador",
      })
      .select("id")
      .single()

    setCreating(false)

    if (error) {
      toast.error("Error al crear el protocolo")
      console.error(error)
      return
    }

    toast.success("Protocolo creado")
    resetForm()
    onOpenChange(false)
    onCreated(data.id)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Protocolo de Medición</DialogTitle>
          <DialogDescription>
            Seleccioná el tipo de medición, cliente, establecimiento e instrumento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Protocol type */}
          <div>
            <Label className="text-xs">Tipo de medición *</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as ProtocolType)
                setInstrumentId("")
              }}
            >
              <SelectTrigger className="text-sm mt-1">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROTOCOL_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div>
            <Label className="text-xs">Cliente *</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v)
                setEstablishmentId("")
              }}
            >
              <SelectTrigger className="text-sm mt-1">
                <SelectValue placeholder="Seleccionar cliente..." />
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

          {/* Establishment */}
          <div>
            <Label className="text-xs">Establecimiento *</Label>
            <Select
              value={establishmentId}
              onValueChange={setEstablishmentId}
              disabled={!clientId}
            >
              <SelectTrigger className="text-sm mt-1">
                <SelectValue
                  placeholder={
                    !clientId
                      ? "Seleccionar cliente primero"
                      : "Seleccionar establecimiento..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredEstablishments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientId && filteredEstablishments.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Este cliente no tiene establecimientos
              </p>
            )}
          </div>

          {/* Instrument */}
          <div>
            <Label className="text-xs">Instrumento *</Label>
            <Select value={instrumentId} onValueChange={setInstrumentId}>
              <SelectTrigger className="text-sm mt-1">
                <SelectValue placeholder="Seleccionar instrumento..." />
              </SelectTrigger>
              <SelectContent>
                {(tipo ? filteredInstruments : instruments).map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nombre} — {i.marca} {i.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Calibration status */}
            {instrumentId && checkingCalibration && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando calibración...
              </p>
            )}
            {instrumentId && calibrationValid === false && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  El instrumento no tiene calibración vigente. No se puede crear
                  el protocolo. Actualice la calibración desde Configuración &gt;
                  Instrumentos.
                </AlertDescription>
              </Alert>
            )}
            {instrumentId && calibrationValid === true && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Calibración vigente
              </p>
            )}
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Fecha *</Label>
              <Input
                type="date"
                value={fechaMedicion}
                onChange={(e) => setFechaMedicion(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hora inicio</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hora fin</Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </div>

          {/* Environmental conditions */}
          <div>
            <Label className="text-xs">Condiciones ambientales</Label>
            <Input
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              placeholder="Ej: Día nublado, 22°C, 60% humedad"
              className="text-sm mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones generales..."
              rows={2}
              className="text-sm mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={
              creating ||
              !tipo ||
              !clientId ||
              !establishmentId ||
              !instrumentId ||
              !fechaMedicion ||
              calibrationValid === false
            }
          >
            {creating && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Crear protocolo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

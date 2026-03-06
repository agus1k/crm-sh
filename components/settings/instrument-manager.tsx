"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  Gauge,
  FlaskConical,
} from "lucide-react"
import { toast } from "sonner"
import type {
  Instrument,
  InstrumentCalibration,
  InstrumentType,
} from "@/lib/crm-types"
import { INSTRUMENT_TYPES } from "@/lib/crm-types"
import { CalibrationBadge } from "@/components/settings/calibration-badge"

const emptyInstrument: Partial<Instrument> = {
  nombre: "",
  tipo: "luxometro",
  marca: "",
  modelo: "",
  numero_serie: "",
}

const emptyCalibration: Partial<InstrumentCalibration> = {
  laboratorio: "",
  numero_certificado: "",
  fecha_calibracion: "",
  fecha_vencimiento: "",
  notas: "",
}

export function InstrumentManager() {
  const { profile } = useAuthStore()
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)

  // Instrument form
  const [instDialogOpen, setInstDialogOpen] = useState(false)
  const [instForm, setInstForm] = useState<Partial<Instrument>>({
    ...emptyInstrument,
  })
  const [savingInst, setSavingInst] = useState(false)

  // Detail sheet
  const [selectedInstrument, setSelectedInstrument] =
    useState<Instrument | null>(null)
  const [calibrations, setCalibrations] = useState<InstrumentCalibration[]>([])
  const [detailOpen, setDetailOpen] = useState(false)

  // Calibration form
  const [calDialogOpen, setCalDialogOpen] = useState(false)
  const [calForm, setCalForm] = useState<Partial<InstrumentCalibration>>({
    ...emptyCalibration,
  })
  const [savingCal, setSavingCal] = useState(false)

  const loadInstruments = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from("instruments")
      .select("*, instrument_calibrations(id, laboratorio, numero_certificado, fecha_calibracion, fecha_vencimiento, certificado_url, notas, created_at, instrument_id, organization_id)")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("nombre")

    const mapped = (data || []).map((inst: any) => {
      const cals = (inst.instrument_calibrations || []) as InstrumentCalibration[]
      // Get latest calibration by fecha_vencimiento
      const latest = cals.length > 0
        ? cals.sort(
            (a: InstrumentCalibration, b: InstrumentCalibration) =>
              new Date(b.fecha_vencimiento).getTime() -
              new Date(a.fecha_vencimiento).getTime()
          )[0]
        : undefined
      const { instrument_calibrations, ...rest } = inst
      return { ...rest, latest_calibration: latest } as Instrument
    })
    setInstruments(mapped)
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    loadInstruments()
  }, [loadInstruments])

  const loadCalibrations = useCallback(
    async (instrumentId: string) => {
      const supabase = createClient()
      const { data } = await supabase
        .from("instrument_calibrations")
        .select("*")
        .eq("instrument_id", instrumentId)
        .order("fecha_vencimiento", { ascending: false })
      setCalibrations((data as InstrumentCalibration[]) || [])
    },
    []
  )

  // === Instrument CRUD ===
  const handleSaveInstrument = async () => {
    if (!profile?.id || !profile?.organization_id || !instForm.nombre?.trim())
      return
    setSavingInst(true)
    const supabase = createClient()

    const payload = {
      nombre: instForm.nombre!.trim(),
      tipo: instForm.tipo || "luxometro",
      marca: instForm.marca || null,
      modelo: instForm.modelo || null,
      numero_serie: instForm.numero_serie || null,
      updated_at: new Date().toISOString(),
    }

    if (instForm.id) {
      const { error } = await supabase
        .from("instruments")
        .update(payload)
        .eq("id", instForm.id)
      if (error) {
        toast.error("Error al actualizar instrumento")
        setSavingInst(false)
        return
      }
      toast.success("Instrumento actualizado")
    } else {
      const { error } = await supabase.from("instruments").insert({
        ...payload,
        organization_id: profile.organization_id,
        owner_id: profile.id,
      })
      if (error) {
        toast.error("Error al crear instrumento")
        setSavingInst(false)
        return
      }
      toast.success("Instrumento creado")
    }

    setSavingInst(false)
    setInstDialogOpen(false)
    loadInstruments()
  }

  const handleDeleteInstrument = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("instruments")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      toast.error("Error al eliminar instrumento")
      return
    }
    toast.success("Instrumento eliminado")
    loadInstruments()
    if (selectedInstrument?.id === id) {
      setDetailOpen(false)
    }
  }

  // === Calibration CRUD ===
  const handleSaveCalibration = async () => {
    if (
      !profile?.organization_id ||
      !selectedInstrument?.id ||
      !calForm.laboratorio?.trim() ||
      !calForm.numero_certificado?.trim() ||
      !calForm.fecha_calibracion ||
      !calForm.fecha_vencimiento
    )
      return
    setSavingCal(true)
    const supabase = createClient()

    const { error } = await supabase.from("instrument_calibrations").insert({
      instrument_id: selectedInstrument.id,
      organization_id: profile.organization_id,
      laboratorio: calForm.laboratorio!.trim(),
      numero_certificado: calForm.numero_certificado!.trim(),
      fecha_calibracion: calForm.fecha_calibracion,
      fecha_vencimiento: calForm.fecha_vencimiento,
      notas: calForm.notas || null,
    })
    if (error) {
      toast.error("Error al registrar calibración")
      setSavingCal(false)
      return
    }
    toast.success("Calibración registrada")
    setSavingCal(false)
    setCalDialogOpen(false)
    loadCalibrations(selectedInstrument.id)
    loadInstruments()
  }

  const handleDeleteCalibration = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("instrument_calibrations")
      .delete()
      .eq("id", id)
    if (error) {
      toast.error("Error al eliminar calibración")
      return
    }
    toast.success("Calibración eliminada")
    if (selectedInstrument) loadCalibrations(selectedInstrument.id)
    loadInstruments()
  }

  const openInstrumentDetail = (inst: Instrument) => {
    setSelectedInstrument(inst)
    loadCalibrations(inst.id)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Instrumentos de Medición</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestioná tus instrumentos y sus calibraciones.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setInstForm({ ...emptyInstrument })
            setInstDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Cargando instrumentos...
        </div>
      ) : instruments.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 border border-border rounded-xl">
          <Gauge className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay instrumentos registrados
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agregá tus instrumentos de medición para controlar sus
            calibraciones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {instruments.map((inst) => (
            <div
              key={inst.id}
              className="bg-muted/30 border border-border rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer group"
              onClick={() => openInstrumentDetail(inst)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {inst.nombre}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {INSTRUMENT_TYPES[inst.tipo]?.label || inst.tipo}
                    {inst.marca ? ` - ${inst.marca}` : ""}
                    {inst.modelo ? ` ${inst.modelo}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CalibrationBadge calibration={inst.latest_calibration} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setInstForm({ ...inst })
                          setInstDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteInstrument(inst.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {inst.numero_serie && (
                <p className="text-xs text-muted-foreground">
                  S/N: {inst.numero_serie}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instrument Form Dialog */}
      <Dialog
        open={instDialogOpen}
        onOpenChange={(open) => {
          if (open)
            setInstForm(instForm.id ? { ...instForm } : { ...emptyInstrument })
          setInstDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {instForm.id ? "Editar instrumento" : "Nuevo instrumento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Luxómetro Tenmars TM-201"
                  value={instForm.nombre || ""}
                  onChange={(e) =>
                    setInstForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={instForm.tipo || "luxometro"}
                  onValueChange={(v) =>
                    setInstForm((p) => ({ ...p, tipo: v as InstrumentType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSTRUMENT_TYPES).map(([k, { label }]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input
                  value={instForm.marca || ""}
                  onChange={(e) =>
                    setInstForm((p) => ({ ...p, marca: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Modelo</Label>
                <Input
                  value={instForm.modelo || ""}
                  onChange={(e) =>
                    setInstForm((p) => ({ ...p, modelo: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Número de serie</Label>
                <Input
                  value={instForm.numero_serie || ""}
                  onChange={(e) =>
                    setInstForm((p) => ({
                      ...p,
                      numero_serie: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInstrument}
              disabled={savingInst || !instForm.nombre?.trim()}
            >
              {savingInst && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {instForm.id ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instrument Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedInstrument && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedInstrument.nombre}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-6">
                {/* Instrument info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span>
                      {INSTRUMENT_TYPES[selectedInstrument.tipo]?.label}
                    </span>
                  </div>
                  {selectedInstrument.marca && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca</span>
                      <span>{selectedInstrument.marca}</span>
                    </div>
                  )}
                  {selectedInstrument.modelo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modelo</span>
                      <span>{selectedInstrument.modelo}</span>
                    </div>
                  )}
                  {selectedInstrument.numero_serie && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N° Serie</span>
                      <span>{selectedInstrument.numero_serie}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Calibración</span>
                    <CalibrationBadge
                      calibration={selectedInstrument.latest_calibration}
                    />
                  </div>
                </div>

                {/* Calibrations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Calibraciones</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setCalForm({ ...emptyCalibration })
                        setCalDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva
                    </Button>
                  </div>
                  {calibrations.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 border border-border rounded-lg">
                      <FlaskConical className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Sin calibraciones registradas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {calibrations.map((cal) => (
                        <div
                          key={cal.id}
                          className="bg-muted/30 border border-border rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {cal.laboratorio}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cert. #{cal.numero_certificado}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalibrationBadge calibration={cal} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteCalibration(cal.id)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>
                              Calibrado:{" "}
                              {new Date(
                                cal.fecha_calibracion
                              ).toLocaleDateString("es-AR")}
                            </span>
                            <span>
                              Vence:{" "}
                              {new Date(
                                cal.fecha_vencimiento
                              ).toLocaleDateString("es-AR")}
                            </span>
                          </div>
                          {cal.notas && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {cal.notas}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Calibration Form Dialog */}
      <Dialog open={calDialogOpen} onOpenChange={setCalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva calibración</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Laboratorio *</Label>
                <Input
                  placeholder="Nombre del laboratorio"
                  value={calForm.laboratorio || ""}
                  onChange={(e) =>
                    setCalForm((p) => ({
                      ...p,
                      laboratorio: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>N° Certificado *</Label>
                <Input
                  value={calForm.numero_certificado || ""}
                  onChange={(e) =>
                    setCalForm((p) => ({
                      ...p,
                      numero_certificado: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha calibración *</Label>
                <Input
                  type="date"
                  value={calForm.fecha_calibracion || ""}
                  onChange={(e) =>
                    setCalForm((p) => ({
                      ...p,
                      fecha_calibracion: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha vencimiento *</Label>
                <Input
                  type="date"
                  value={calForm.fecha_vencimiento || ""}
                  onChange={(e) =>
                    setCalForm((p) => ({
                      ...p,
                      fecha_vencimiento: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notas</Label>
                <Textarea
                  rows={2}
                  value={calForm.notas || ""}
                  onChange={(e) =>
                    setCalForm((p) => ({ ...p, notas: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCalibration}
              disabled={
                savingCal ||
                !calForm.laboratorio?.trim() ||
                !calForm.numero_certificado?.trim() ||
                !calForm.fecha_calibracion ||
                !calForm.fecha_vencimiento
              }
            >
              {savingCal && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

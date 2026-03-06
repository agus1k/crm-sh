"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePDFGenerator } from "@/hooks/use-pdf-generator"
import { ProtocoloIluminacionPDF } from "@/lib/pdf/templates/protocolo-iluminacion"
import { ProtocoloRuidoPDF } from "@/lib/pdf/templates/protocolo-ruido"
import { ProtocoloPATPDF } from "@/lib/pdf/templates/protocolo-pat"
import type {
  MeasurementProtocol,
  MeasurementPoint,
  Organization,
  ProtocolType,
} from "@/lib/crm-types"
import { PROTOCOL_TYPES, PROTOCOL_STATUSES } from "@/lib/crm-types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Loader2,
  ArrowLeft,
  FileDown,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Gauge,
  Sun,
  Volume2,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Thermometer,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const typeIcons: Record<ProtocolType, React.ComponentType<{ className?: string }>> = {
  iluminacion: Sun,
  ruido: Volume2,
  pat: Zap,
}

// Full protocol type with all joined relations
type ProtocolWithRelations = MeasurementProtocol & {
  client?: { id: string; razon_social: string } | null
  establishment?: { id: string; nombre: string; direccion?: string | null } | null
  profesional?: {
    id: string
    full_name: string | null
    matricula?: string | null
    credentials?: { id: string; tipo: string; numero: string; jurisdiccion?: string | null }[]
  } | null
  instrument?: {
    id: string
    nombre: string
    marca?: string | null
    modelo?: string | null
    numero_serie?: string | null
  } | null
  points?: MeasurementPoint[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProtocolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const protocolId = params.id as string

  const [protocol, setProtocol] = useState<ProtocolWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmSign, setConfirmSign] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { generating, generatePDF } = usePDFGenerator({
    organizationId: profile?.organization_id || "",
    recordType: "protocolo",
    recordId: protocolId,
    fileName: protocol
      ? `protocolo-${protocol.tipo}-${format(new Date(protocol.fecha_medicion + "T12:00:00"), "yyyy-MM-dd")}.pdf`
      : undefined,
  })

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("measurement_protocols")
      .select(`
        *,
        client:clients(*),
        establishment:establishments(*),
        profesional:profiles!measurement_protocols_profesional_id_fkey(*, credentials:professional_credentials(*)),
        instrument:instruments(*),
        points:measurement_points(*)
      `)
      .eq("id", protocolId)
      .single()

    if (error || !data) {
      toast.error("No se encontro el protocolo")
      router.push("/mediciones")
      return
    }

    // Sort points by punto_numero
    if (data.points && Array.isArray(data.points)) {
      data.points.sort(
        (a: MeasurementPoint, b: MeasurementPoint) =>
          (a.punto_numero ?? 0) - (b.punto_numero ?? 0)
      )
    }

    setProtocol(data as ProtocolWithRelations)
    setLoading(false)
  }, [profile?.organization_id, protocolId, router])

  useEffect(() => {
    load()
  }, [load])

  // ---------------------------------------------------------------------------
  // PDF generation
  // ---------------------------------------------------------------------------

  const handleGeneratePDF = async () => {
    if (!protocol || !organization) return

    let doc: React.ReactElement<any>

    switch (protocol.tipo) {
      case "iluminacion":
        doc = (
          <ProtocoloIluminacionPDF
            protocol={protocol as any}
            organization={organization as Organization}
          />
        )
        break
      case "ruido":
        doc = (
          <ProtocoloRuidoPDF
            protocol={protocol as any}
            organization={organization as Organization}
          />
        )
        break
      case "pat":
        doc = (
          <ProtocoloPATPDF
            protocol={protocol as any}
            organization={organization as Organization}
          />
        )
        break
    }

    await generatePDF(doc as any)
  }

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  const handleComplete = async () => {
    if (!protocol) return

    setTransitioning(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("measurement_protocols")
      .update({ status: "completado" })
      .eq("id", protocolId)

    setTransitioning(false)
    setConfirmComplete(false)

    if (error) {
      toast.error("Error al completar el protocolo")
      console.error(error)
      return
    }

    setProtocol((prev) => (prev ? { ...prev, status: "completado" } : null))
    toast.success("Protocolo marcado como completado")
  }

  const handleSign = async () => {
    if (!protocol) return

    setTransitioning(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("measurement_protocols")
      .update({ status: "firmado" })
      .eq("id", protocolId)

    setTransitioning(false)
    setConfirmSign(false)

    if (error) {
      toast.error("Error al firmar el protocolo")
      console.error(error)
      return
    }

    setProtocol((prev) => (prev ? { ...prev, status: "firmado" } : null))
    toast.success("Protocolo firmado correctamente")
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!protocol) return

    setTransitioning(true)
    const supabase = createClient()

    // Delete points first (cascade might handle this, but be explicit)
    await supabase
      .from("measurement_points")
      .delete()
      .eq("protocol_id", protocolId)

    const { error } = await supabase
      .from("measurement_protocols")
      .delete()
      .eq("id", protocolId)

    setTransitioning(false)
    setConfirmDelete(false)

    if (error) {
      toast.error("Error al eliminar el protocolo")
      console.error(error)
      return
    }

    toast.success("Protocolo eliminado")
    router.push("/mediciones")
  }

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <Topbar title="Detalle de Protocolo" description="Cargando..." />
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando protocolo...</span>
        </div>
      </>
    )
  }

  if (!protocol) return null

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const typeInfo = PROTOCOL_TYPES[protocol.tipo]
  const statusInfo = PROTOCOL_STATUSES[protocol.status]
  const TypeIcon = typeIcons[protocol.tipo]
  const points = protocol.points || []

  const compliancePercent = protocol.porcentaje_cumplimiento ?? 0
  const complianceColor =
    compliancePercent >= 80
      ? "text-green-600 dark:text-green-400"
      : compliancePercent >= 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400"

  const progressColor =
    compliancePercent >= 80
      ? "[&>div]:bg-green-500"
      : compliancePercent >= 60
        ? "[&>div]:bg-yellow-500"
        : "[&>div]:bg-red-500"

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Topbar
        title="Detalle de Protocolo"
        description={`${typeInfo.label} - ${statusInfo.label}`}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* Back button */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/mediciones")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mediciones
          </Button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Header card */}
        {/* ----------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    typeInfo.color
                  )}
                >
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Protocolo de medicion
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", statusInfo.color)}
                >
                  {statusInfo.label}
                </Badge>

                {protocol.cumple_general != null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      protocol.cumple_general
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {protocol.cumple_general ? "CUMPLE" : "NO CUMPLE"}
                  </Badge>
                )}

                {protocol.porcentaje_cumplimiento != null && (
                  <span className={cn("text-sm font-bold", complianceColor)}>
                    {Math.round(protocol.porcentaje_cumplimiento)}%
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {/* Cliente */}
              {protocol.client?.razon_social && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{protocol.client.razon_social}</span>
                </div>
              )}

              {/* Establecimiento */}
              {protocol.establishment?.nombre && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{protocol.establishment.nombre}</span>
                </div>
              )}

              {/* Fecha */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {format(
                    new Date(protocol.fecha_medicion + "T12:00:00"),
                    "EEEE d 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </span>
              </div>

              {/* Horario */}
              {protocol.hora_inicio && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {protocol.hora_inicio}
                    {protocol.hora_fin ? ` - ${protocol.hora_fin}` : ""}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ----------------------------------------------------------------- */}
        {/* Action buttons */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Generar PDF */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generating}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            Generar PDF
          </Button>

          {/* Status transition: borrador -> completado */}
          {protocol.status === "borrador" && (
            <Button
              size="sm"
              onClick={() => setConfirmComplete(true)}
              disabled={transitioning}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completar
            </Button>
          )}

          {/* Status transition: completado -> firmado */}
          {protocol.status === "completado" && (
            <Button
              size="sm"
              onClick={() => setConfirmSign(true)}
              disabled={transitioning}
              className="gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Firmar
            </Button>
          )}

          {/* Delete (only borrador) */}
          {protocol.status === "borrador" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={transitioning}
              className="gap-1.5 ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Protocol info card */}
        {/* ----------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Informacion del Protocolo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {/* Profesional */}
              {protocol.profesional?.full_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Profesional
                  </p>
                  <p className="text-foreground">
                    {protocol.profesional.full_name}
                  </p>
                  {protocol.profesional.credentials &&
                    protocol.profesional.credentials.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mat.{" "}
                        {protocol.profesional.credentials
                          .map((c) => c.numero)
                          .join(", ")}
                      </p>
                    )}
                </div>
              )}

              {/* Instrumento */}
              {protocol.instrument && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Instrumento
                  </p>
                  <p className="text-foreground">{protocol.instrument.nombre}</p>
                  {(protocol.instrument.marca || protocol.instrument.modelo) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[protocol.instrument.marca, protocol.instrument.modelo]
                        .filter(Boolean)
                        .join(" ")}
                      {protocol.instrument.numero_serie &&
                        ` - S/N: ${protocol.instrument.numero_serie}`}
                    </p>
                  )}
                </div>
              )}

              {/* Condiciones ambientales */}
              {protocol.condiciones_ambientales && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    <Thermometer className="h-3 w-3 inline mr-1" />
                    Condiciones Ambientales
                  </p>
                  <p className="text-foreground">
                    {protocol.condiciones_ambientales}
                  </p>
                </div>
              )}

              {/* Horario */}
              {protocol.hora_inicio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Horario de Medicion
                  </p>
                  <p className="text-foreground">
                    {protocol.hora_inicio}
                    {protocol.hora_fin ? ` a ${protocol.hora_fin}` : ""}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ----------------------------------------------------------------- */}
        {/* Compliance summary */}
        {/* ----------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Resumen de Cumplimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {protocol.puntos_total}
                </p>
                <p className="text-xs text-muted-foreground">Puntos totales</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {protocol.puntos_cumple}
                </p>
                <p className="text-xs text-muted-foreground">Cumple</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {protocol.puntos_no_cumple}
                </p>
                <p className="text-xs text-muted-foreground">No cumple</p>
              </div>
            </div>

            {protocol.porcentaje_cumplimiento != null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Porcentaje de cumplimiento
                  </span>
                  <span className={cn("font-bold", complianceColor)}>
                    {Math.round(protocol.porcentaje_cumplimiento)}%
                  </span>
                </div>
                <Progress
                  value={protocol.porcentaje_cumplimiento}
                  className={cn("h-2.5", progressColor)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ----------------------------------------------------------------- */}
        {/* Measurement points table */}
        {/* ----------------------------------------------------------------- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Puntos de Medicion ({points.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {points.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <TypeIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay puntos de medicion registrados</p>
              </div>
            ) : (
              <>
                {/* Iluminacion table */}
                {protocol.tipo === "iluminacion" && (
                  <IlluminationTable points={points} />
                )}

                {/* Ruido table */}
                {protocol.tipo === "ruido" && <NoiseTable points={points} />}

                {/* PAT table */}
                {protocol.tipo === "pat" && <GroundingTable points={points} />}
              </>
            )}
          </CardContent>
        </Card>

        {/* ----------------------------------------------------------------- */}
        {/* Notas */}
        {/* ----------------------------------------------------------------- */}
        {protocol.notas && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                {protocol.notas}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* =================================================================== */}
      {/* Confirm dialogs */}
      {/* =================================================================== */}

      {/* Completar */}
      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Completar protocolo</AlertDialogTitle>
            <AlertDialogDescription>
              Al completar el protocolo se marcara como finalizado. No podras
              volver al estado borrador. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={transitioning}>
              {transitioning && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Completar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Firmar */}
      <AlertDialog open={confirmSign} onOpenChange={setConfirmSign}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmar protocolo</AlertDialogTitle>
            <AlertDialogDescription>
              Al firmar el protocolo quedara como registro oficial. Esta accion
              no se puede deshacer. ¿Confirmar firma?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSign} disabled={transitioning}>
              {transitioning && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Firmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar protocolo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el protocolo y todos sus puntos de medicion
              de forma permanente. ¿Estas seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={transitioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {transitioning && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ===========================================================================
// Measurement point tables by type
// ===========================================================================

function CumpleBadge({ value }: { value: boolean | null }) {
  if (value === null || value === undefined) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        S/D
      </Badge>
    )
  }
  return value ? (
    <Badge
      variant="secondary"
      className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    >
      Cumple
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    >
      No cumple
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Iluminacion
// ---------------------------------------------------------------------------

function IlluminationTable({ points }: { points: MeasurementPoint[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">#</TableHead>
          <TableHead className="text-xs">Puesto</TableHead>
          <TableHead className="text-xs">Sector</TableHead>
          <TableHead className="text-xs">Tarea Visual</TableHead>
          <TableHead className="text-xs text-right">Valor Medido (lux)</TableHead>
          <TableHead className="text-xs text-right">Valor Min (lux)</TableHead>
          <TableHead className="text-xs text-right">Referencia (lux)</TableHead>
          <TableHead className="text-xs text-right">Uniformidad</TableHead>
          <TableHead className="text-xs text-center">Cumple</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map((point, i) => (
          <TableRow key={point.id || i}>
            <TableCell className="text-xs text-muted-foreground">
              {point.punto_numero ?? i + 1}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {point.punto_nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {point.sector?.nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {point.ilum_tarea || "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ilum_valor_medido_lux != null
                ? point.ilum_valor_medido_lux
                : "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ilum_valor_minimo_lux != null
                ? point.ilum_valor_minimo_lux
                : "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {"-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ilum_uniformidad != null
                ? point.ilum_uniformidad.toFixed(2)
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              <CumpleBadge value={point.cumple} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Ruido
// ---------------------------------------------------------------------------

function NoiseTable({ points }: { points: MeasurementPoint[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">#</TableHead>
          <TableHead className="text-xs">Puesto</TableHead>
          <TableHead className="text-xs">Sector</TableHead>
          <TableHead className="text-xs text-right">Nivel Medido (dB)</TableHead>
          <TableHead className="text-xs">Tipo Ruido</TableHead>
          <TableHead className="text-xs text-right">Tiempo Exp. (hs)</TableHead>
          <TableHead className="text-xs text-right">Dosis (%)</TableHead>
          <TableHead className="text-xs text-center">Cumple</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map((point, i) => (
          <TableRow key={point.id || i}>
            <TableCell className="text-xs text-muted-foreground">
              {point.punto_numero ?? i + 1}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {point.punto_nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {point.sector?.nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ruido_valor_medido_dba != null
                ? point.ruido_valor_medido_dba
                : "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground capitalize">
              {point.ruido_tipo_ruido || "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ruido_tiempo_exposicion_hs != null
                ? point.ruido_tiempo_exposicion_hs
                : "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.ruido_dosis != null
                ? (point.ruido_dosis * 100).toFixed(1)
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              <CumpleBadge value={point.cumple} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// PAT (Puesta a Tierra)
// ---------------------------------------------------------------------------

function GroundingTable({ points }: { points: MeasurementPoint[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">#</TableHead>
          <TableHead className="text-xs">Puesto</TableHead>
          <TableHead className="text-xs">Sector</TableHead>
          <TableHead className="text-xs">Tipo Electrodo</TableHead>
          <TableHead className="text-xs text-right">Profundidad (m)</TableHead>
          <TableHead className="text-xs text-right">Valor Medido (ohm)</TableHead>
          <TableHead className="text-xs text-right">Valor Max (ohm)</TableHead>
          <TableHead className="text-xs text-center">Cumple</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map((point, i) => (
          <TableRow key={point.id || i}>
            <TableCell className="text-xs text-muted-foreground">
              {point.punto_numero ?? i + 1}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {point.punto_nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {point.sector?.nombre || "-"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {point.pat_tipo_electrodo || "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.pat_profundidad_m != null ? point.pat_profundidad_m : "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.pat_valor_medido_ohm != null
                ? point.pat_valor_medido_ohm
                : "-"}
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              {point.pat_valor_maximo_ohm != null
                ? point.pat_valor_maximo_ohm
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              <CumpleBadge value={point.cumple} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { usePDFGenerator } from "@/hooks/use-pdf-generator"
import { MatrizRiesgosPDF } from "@/lib/pdf/templates/matriz-riesgos"
import type {
  RiskAssessment,
  Hazard,
  Organization,
  Client,
  Establishment,
  DBSector,
  Profile,
  ProfessionalCredential,
  WorkPosition,
  HazardCategoria,
  RiskClasificacion,
} from "@/lib/crm-types"
import {
  HAZARD_CATEGORIAS,
  RISK_CLASIFICACION_COLORS,
} from "@/lib/crm-types"
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
  User,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileEdit,
  Trash2,
  FileText,
  Briefcase,
  Wrench,
  Clock,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  borrador: {
    label: "Borrador",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: <FileEdit className="h-3 w-3" />,
  },
  completado: {
    label: "Completado",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  firmado: {
    label: "Firmado",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
}

const CLASIFICACION_ORDER: RiskClasificacion[] = [
  "Intolerable",
  "Importante",
  "Moderado",
  "Tolerable",
]

const CATEGORIA_COLORS: Record<HazardCategoria, string> = {
  fisico: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  quimico: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  biologico: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  ergonomico: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  mecanico: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  electrico: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  incendio: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  locativo: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  psicosocial: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  natural: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const SUB_INDEX_LABELS: Record<string, string> = {
  indice_personas_expuestas: "PE",
  indice_procedimientos: "Proc",
  indice_capacitacion: "Cap",
  indice_exposicion: "Exp",
  indice_severidad: "Sev",
}

// ---------------------------------------------------------------------------
// Types for joined query
// ---------------------------------------------------------------------------

type AssessmentWithRelations = RiskAssessment & {
  client?: Client
  establishment?: Establishment
  sector?: DBSector
  profesional?: Profile & { credentials?: ProfessionalCredential[] }
  hazards?: (Hazard & { work_position?: WorkPosition })[]
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RiskAssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<AssessmentWithRelations | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // PDF generator
  const { generating, generatePDF } = usePDFGenerator({
    organizationId: profile?.organization_id || "",
    recordType: "matriz-riesgos",
    recordId: assessmentId,
    fileName: assessment
      ? `matriz-riesgos-${assessment.titulo.replace(/\s+/g, "-").toLowerCase()}.pdf`
      : undefined,
  })

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const load = useCallback(async () => {
    if (!profile?.organization_id || !assessmentId) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    const { data, error } = await supabase
      .from("risk_assessments")
      .select(
        `
        *,
        client:clients(*),
        establishment:establishments(*),
        sector:sectors(*),
        profesional:profiles(*, credentials:professional_credentials(*)),
        hazards:hazards(*, work_position:work_positions(*))
      `
      )
      .eq("id", assessmentId)
      .single()

    if (error) {
      toast.error("Evaluación no encontrada: " + error.message)
      router.push("/riesgos")
      return
    }

    setAssessment(data as AssessmentWithRelations)
    setLoading(false)
  }, [profile?.organization_id, assessmentId, router])

  useEffect(() => {
    load()
  }, [load])

  // -------------------------------------------------------------------------
  // Hazards summary
  // -------------------------------------------------------------------------

  const hazards = useMemo(() => assessment?.hazards || [], [assessment])

  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      Tolerable: 0,
      Moderado: 0,
      Importante: 0,
      Intolerable: 0,
    }
    for (const h of hazards) {
      if (h.clasificacion && counts[h.clasificacion] !== undefined) {
        counts[h.clasificacion]++
      }
    }
    return { total: hazards.length, ...counts }
  }, [hazards])

  // -------------------------------------------------------------------------
  // PDF generation
  // -------------------------------------------------------------------------

  const handleGeneratePDF = useCallback(async () => {
    if (!assessment || !organization) {
      toast.error("No se pudo generar el PDF. Datos incompletos.")
      return
    }
    const doc = (
      <MatrizRiesgosPDF
        assessment={assessment}
        organization={organization}
      />
    )
    await generatePDF(doc as any)
  }, [assessment, organization, generatePDF])

  // -------------------------------------------------------------------------
  // Status transitions
  // -------------------------------------------------------------------------

  const handleStatusChange = useCallback(
    async (newStatus: "completado" | "firmado") => {
      if (!assessment) return
      setStatusUpdating(true)
      const supabase = createClient()
      const { error } = await supabase
        .from("risk_assessments")
        .update({ status: newStatus })
        .eq("id", assessment.id)

      if (error) {
        toast.error("Error al actualizar estado: " + error.message)
        setStatusUpdating(false)
        return
      }
      toast.success(
        newStatus === "completado"
          ? "Evaluación marcada como completada"
          : "Evaluación firmada correctamente"
      )
      setStatusUpdating(false)
      load()
    },
    [assessment, load]
  )

  // -------------------------------------------------------------------------
  // Delete assessment
  // -------------------------------------------------------------------------

  const handleDelete = useCallback(async () => {
    if (!assessment) return
    setDeleting(true)
    const supabase = createClient()

    // Delete linked observations first
    await supabase
      .from("observations")
      .delete()
      .eq("source_type", "riesgo")
      .eq("source_id", assessment.id)

    const { error } = await supabase
      .from("risk_assessments")
      .delete()
      .eq("id", assessment.id)

    if (error) {
      toast.error("Error al eliminar evaluación: " + error.message)
      setDeleting(false)
      return
    }
    toast.success("Evaluación eliminada")
    router.push("/riesgos")
  }, [assessment, router])

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <Topbar
          title="Detalle de Evaluación de Riesgos"
          description="Cargando..."
        />
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando evaluación...</span>
        </div>
      </>
    )
  }

  if (!assessment) return null

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const statusInfo = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.borrador
  const client = assessment.client
  const establishment = assessment.establishment
  const sector = assessment.sector
  const profesional = assessment.profesional

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <Topbar
        title="Detalle de Evaluación de Riesgos"
        description={assessment.titulo}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Breadcrumb + Back button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push("/riesgos")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/riesgos">
                  Evaluaciones de Riesgos
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{assessment.titulo}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header card */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">{assessment.titulo}</h2>
              <Badge variant="secondary" className={`gap-1 ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={generating}
                onClick={handleGeneratePDF}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                {generating ? "Generando..." : "Generar PDF"}
              </Button>

              {assessment.status === "borrador" && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange("completado")}
                >
                  {statusUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Completar
                </Button>
              )}

              {assessment.status === "completado" && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange("firmado")}
                >
                  {statusUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Firmar
                </Button>
              )}

              {assessment.status === "borrador" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive gap-1.5"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Eliminar evaluación de riesgos
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará la evaluación, todos los peligros
                        identificados y las observaciones vinculadas. No se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">
                  {client?.razon_social || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Establecimiento</p>
                <p className="text-sm font-medium">
                  {establishment?.nombre || "-"}
                </p>
              </div>
            </div>

            {sector && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sector</p>
                  <p className="text-sm font-medium">{sector.nombre}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">
                  {format(
                    new Date(assessment.fecha + "T12:00:00"),
                    "EEEE d 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Profesional</p>
                <p className="text-sm font-medium">
                  {profesional?.full_name || "-"}
                </p>
                {profesional?.matricula && (
                  <p className="text-xs text-muted-foreground">
                    Mat. {profesional.matricula}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total peligros</p>
          </div>
          {CLASIFICACION_ORDER.map((clasif) => {
            const count = summary[clasif as keyof typeof summary] as number
            const colorClass = RISK_CLASIFICACION_COLORS[clasif]
            return (
              <div
                key={clasif}
                className="rounded-xl border bg-card p-4 text-center"
              >
                <p className="text-2xl font-bold">{count}</p>
                <Badge className={`mt-1 text-[10px] ${colorClass}`}>
                  {clasif}
                </Badge>
              </div>
            )
          })}
        </div>

        {/* Hazards section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Peligros identificados ({hazards.length})
          </h3>

          {hazards.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No se identificaron peligros en esta evaluación
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hazards.map((hazard) => (
                <HazardCard key={hazard.id} hazard={hazard} />
              ))}
            </div>
          )}
        </div>

        {/* Notas section */}
        {assessment.notas && (
          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assessment.notas}
            </p>
          </div>
        )}

        {/* Bottom back button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/riesgos")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a evaluaciones
          </Button>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// HazardCard — individual hazard display
// ---------------------------------------------------------------------------

function HazardCard({
  hazard,
}: {
  hazard: Hazard & { work_position?: WorkPosition }
}) {
  const clasificacionColor = hazard.clasificacion
    ? RISK_CLASIFICACION_COLORS[hazard.clasificacion]
    : ""
  const categoriaColor =
    CATEGORIA_COLORS[hazard.categoria] || CATEGORIA_COLORS.fisico
  const categoriaLabel =
    HAZARD_CATEGORIAS[hazard.categoria] || hazard.categoria

  const hasTheoreticalValues =
    hazard.probabilidad_teorica != null || hazard.nivel_riesgo_teorico != null

  return (
    <div className="border rounded-xl bg-card p-4 space-y-3">
      {/* Header row: factor + categoria + clasificacion */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <p className="font-medium text-sm">{hazard.factor_riesgo}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${categoriaColor}`}>
              {categoriaLabel}
            </Badge>
            {hazard.work_position?.nombre && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                {hazard.work_position.nombre}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hazard.clasificacion && hazard.nivel_riesgo != null && (
            <Badge className={clasificacionColor}>
              NR: {hazard.nivel_riesgo.toFixed(1)} — {hazard.clasificacion}
            </Badge>
          )}
        </div>
      </div>

      {/* Source + effect */}
      {(hazard.fuente || hazard.efecto_posible) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {hazard.fuente && (
            <div>
              <span className="font-medium text-foreground/70">Fuente:</span>{" "}
              {hazard.fuente}
            </div>
          )}
          {hazard.efecto_posible && (
            <div>
              <span className="font-medium text-foreground/70">Efecto:</span>{" "}
              {hazard.efecto_posible}
            </div>
          )}
        </div>
      )}

      {/* Risk indices — actual values */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Índices de riesgo
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(SUB_INDEX_LABELS) as [string, string][]).map(
            ([key, label]) => {
              const value = hazard[key as keyof Hazard] as number | null
              if (value == null) return null
              return (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-[10px] font-mono"
                >
                  {label}: {value}
                </Badge>
              )
            }
          )}
          {hazard.probabilidad != null && (
            <Badge variant="outline" className="text-[10px] font-mono">
              Prob: {hazard.probabilidad.toFixed(1)}
            </Badge>
          )}
          {hazard.nivel_riesgo != null && (
            <Badge variant="outline" className="text-[10px] font-mono font-semibold">
              NR: {hazard.nivel_riesgo.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Theoretical values (secondary style) */}
      {hasTheoreticalValues && (
        <div className="space-y-1.5 opacity-70">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Valores teóricos (post-mejora)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hazard.indice_personas_expuestas_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                PE: {hazard.indice_personas_expuestas_teorico}
              </Badge>
            )}
            {hazard.indice_procedimientos_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                Proc: {hazard.indice_procedimientos_teorico}
              </Badge>
            )}
            {hazard.indice_capacitacion_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                Cap: {hazard.indice_capacitacion_teorico}
              </Badge>
            )}
            {hazard.indice_exposicion_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                Exp: {hazard.indice_exposicion_teorico}
              </Badge>
            )}
            {hazard.indice_severidad_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                Sev: {hazard.indice_severidad_teorico}
              </Badge>
            )}
            {hazard.probabilidad_teorica != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed">
                Prob: {hazard.probabilidad_teorica.toFixed(1)}
              </Badge>
            )}
            {hazard.nivel_riesgo_teorico != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-dashed font-semibold">
                NR: {hazard.nivel_riesgo_teorico.toFixed(1)}
              </Badge>
            )}
            {hazard.clasificacion_teorica && (
              <Badge
                className={`text-[10px] ${
                  RISK_CLASIFICACION_COLORS[hazard.clasificacion_teorica]
                }`}
              >
                {hazard.clasificacion_teorica}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Corrective measure */}
      {hazard.medida_correctiva && (
        <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            Medida correctiva
          </p>
          <p className="text-muted-foreground">{hazard.medida_correctiva}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {hazard.responsable_mejora && (
              <p className="text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="font-medium">Responsable:</span>{" "}
                {hazard.responsable_mejora}
              </p>
            )}
            {hazard.fecha_limite_mejora && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Fecha límite:</span>{" "}
                {format(
                  new Date(hazard.fecha_limite_mejora + "T12:00:00"),
                  "d MMM yyyy",
                  { locale: es }
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

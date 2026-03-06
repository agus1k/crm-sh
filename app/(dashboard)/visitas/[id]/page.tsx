"use client"

import { useEffect, useState, useCallback } from "react"
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
import { VisitForm } from "@/components/visits/visit-form"
import { usePDFGenerator } from "@/hooks/use-pdf-generator"
import { ConstanciaVisitaPDF } from "@/lib/pdf/templates/constancia-visita"
import {
  Loader2,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  FileDown,
  AlertTriangle,
  Pencil,
  Trash2,
  CheckCircle2,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type {
  Visit,
  VisitObservation,
  VisitStatus,
  Organization,
  Client,
  Establishment,
  Profile,
  ProfessionalCredential,
  DBSector,
} from "@/lib/crm-types"
import {
  VISIT_STATUSES,
  OBSERVATION_TYPES,
  OBSERVATION_PRIORITIES,
} from "@/lib/crm-types"

type VisitWithRelations = Visit & {
  client?: Client
  establishment?: Establishment
  profesional?: Profile & { credentials?: ProfessionalCredential[] }
  observations?: (VisitObservation & { sector?: DBSector })[]
}

export default function VisitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const id = params.id as string

  const [visit, setVisit] = useState<VisitWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  const { generating, generatePDF } = usePDFGenerator({
    organizationId: profile?.organization_id || "",
    recordType: "visitas",
    recordId: id,
    fileName: `constancia-visita-${visit?.fecha || "draft"}.pdf`,
  })

  const load = useCallback(async () => {
    if (!profile?.organization_id || !id) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    const { data, error } = await supabase
      .from("visits")
      .select(`
        *,
        client:clients(*),
        establishment:establishments(*),
        profesional:profiles!visits_profesional_id_fkey(*, credentials:professional_credentials(*)),
        observations:visit_observations(*, sector:sectors(*))
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      toast.error("Visita no encontrada")
      router.push("/visitas")
      return
    }

    setVisit(data as VisitWithRelations)
    setLoading(false)
  }, [profile?.organization_id, id, router])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (newStatus: VisitStatus) => {
    if (!visit) return
    const supabase = createClient()
    const { error } = await supabase
      .from("visits")
      .update({ status: newStatus })
      .eq("id", visit.id)

    if (error) {
      toast.error(`Error: ${error.message}`)
      return
    }
    toast.success(
      newStatus === "firmado"
        ? "Visita firmada correctamente"
        : newStatus === "enviado"
          ? "Visita marcada como enviada"
          : "Estado actualizado"
    )
    load()
  }

  const handleDelete = async () => {
    if (!visit) return
    const supabase = createClient()

    // Delete central observations linked to this visit
    await supabase
      .from("observations")
      .delete()
      .eq("source_type", "visita")
      .eq("source_id", visit.id)

    // Delete visit (cascades to visit_observations)
    const { error } = await supabase
      .from("visits")
      .delete()
      .eq("id", visit.id)

    if (error) {
      toast.error(`Error: ${error.message}`)
      return
    }
    toast.success("Visita eliminada")
    router.push("/visitas")
  }

  const handleGeneratePDF = async () => {
    if (!visit || !organization) return
    const doc = (
      <ConstanciaVisitaPDF visit={visit} organization={organization} />
    )
    await generatePDF(doc)
  }

  if (loading) {
    return (
      <>
        <Topbar title="Visita" description="Cargando..." />
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando visita...</span>
        </div>
      </>
    )
  }

  if (!visit) return null

  const statusInfo = VISIT_STATUSES[visit.status]
  const client = visit.client
  const establishment = visit.establishment
  const profesional = visit.profesional
  const observations = visit.observations || []

  return (
    <>
      <Topbar
        title="Detalle de Visita"
        description="Constancia de visita técnica"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/visitas">Visitas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {format(new Date(visit.fecha + "T12:00:00"), "d MMM yyyy", {
                  locale: es,
                })}
                {client?.razon_social && ` — ${client.razon_social}`}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with status & actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={statusInfo.color}
            >
              {statusInfo.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* PDF generation */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleGeneratePDF}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              {generating ? "Generando..." : "Generar PDF"}
            </Button>

            {/* Status transitions */}
            {visit.status === "borrador" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleStatusChange("firmado")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Firmar
                </Button>
              </>
            )}
            {visit.status === "firmado" && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleStatusChange("enviado")}
              >
                <Send className="h-3.5 w-3.5" />
                Marcar como enviado
              </Button>
            )}

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar visita</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará la visita y todas sus observaciones
                    asociadas. No se puede deshacer.
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
          </div>
        </div>

        {/* Visit info card */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base">{visit.motivo}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">
                  {client?.razon_social || "-"}
                </p>
                {client?.cuit && (
                  <p className="text-xs text-muted-foreground">
                    CUIT: {client.cuit}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Establecimiento
                </p>
                <p className="text-sm font-medium">
                  {establishment?.nombre || "-"}
                </p>
                {establishment?.direccion && (
                  <p className="text-xs text-muted-foreground">
                    {establishment.direccion}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">
                  {format(
                    new Date(visit.fecha + "T12:00:00"),
                    "EEEE d 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Horario</p>
                <p className="text-sm font-medium">
                  {visit.hora_ingreso
                    ? visit.hora_ingreso.slice(0, 5)
                    : "--:--"}{" "}
                  —{" "}
                  {visit.hora_egreso
                    ? visit.hora_egreso.slice(0, 5)
                    : "--:--"}
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

            {visit.acompanante && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Acompañante
                  </p>
                  <p className="text-sm font-medium">{visit.acompanante}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones realizadas */}
        {visit.acciones_realizadas && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Acciones realizadas
            </h3>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {visit.acciones_realizadas}
              </p>
            </div>
          </div>
        )}

        {/* Observations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Observaciones ({observations.length})
            </h3>
          </div>

          {observations.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No se registraron observaciones en esta visita
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {observations.map((obs, index) => {
                const typeInfo = OBSERVATION_TYPES[obs.tipo]
                const priorityInfo = OBSERVATION_PRIORITIES[obs.prioridad]

                return (
                  <div
                    key={obs.id}
                    className="border rounded-lg p-4 bg-card space-y-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${priorityInfo.color}`}
                      >
                        {priorityInfo.label}
                      </Badge>
                      {obs.sector?.nombre && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {obs.sector.nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {obs.descripcion}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/visitas")}
          >
            <span className="sr-only">Volver</span>
            Volver a visitas
          </Button>
        </div>
      </div>

      {/* Edit form dialog */}
      <VisitForm
        open={editOpen}
        onOpenChange={setEditOpen}
        visit={visit}
        onSaved={load}
      />
    </>
  )
}

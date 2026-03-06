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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IncidentForm } from "@/components/incidents/incident-form"
import { CausalAnalysis } from "@/components/incidents/causal-analysis"
import { SinistralityIndices } from "@/components/incidents/sinistrality-indices"
import { usePDFGenerator } from "@/hooks/use-pdf-generator"
import { InvestigacionIncidentePDF } from "@/lib/pdf/templates/investigacion-incidente"
import type {
  Incident,
  IncidentCause,
  IncidentCasualty,
  IncidentStatus,
  CasualtyTipo,
  Organization,
} from "@/lib/crm-types"
import {
  INCIDENT_TIPOS,
  INCIDENT_GRAVEDADES,
  INCIDENT_GRAVEDAD_COLORS,
  INCIDENT_STATUSES,
  CAUSE_GRUPOS,
  CASUALTY_TIPOS,
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
  Clock,
  User,
  ShieldAlert,
  AlertCircle,
  Search,
  CheckCircle2,
  Trash2,
  Users,
  Target,
  Pencil,
  Plus,
  Heart,
  BarChart3,
} from "lucide-react"

const STATUS_CONFIG: Record<
  IncidentStatus,
  {
    label: string
    icon: React.ReactNode
    variant: "destructive" | "default" | "secondary"
  }
> = {
  reportado: {
    label: "Reportado",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    variant: "destructive",
  },
  en_investigacion: {
    label: "En Investigación",
    icon: <Search className="h-3.5 w-3.5" />,
    variant: "default",
  },
  cerrado: {
    label: "Cerrado",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    variant: "secondary",
  },
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const incidentId = params.id as string

  const [incident, setIncident] = useState<Incident | null>(null)
  const [causes, setCauses] = useState<IncidentCause[]>([])
  const [casualties, setCasualties] = useState<IncidentCasualty[]>([])
  const [allIncidents, setAllIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [addCasualtyOpen, setAddCasualtyOpen] = useState(false)

  // Casualty form fields
  const [casualtyNombre, setCasualtyNombre] = useState("")
  const [casualtyTipo, setCasualtyTipo] = useState<string>("")
  const [casualtyDias, setCasualtyDias] = useState<number>(0)
  const [casualtyCreating, setCasualtyCreating] = useState(false)

  // PDF generator
  const { generating, generatePDF } = usePDFGenerator({
    organizationId: profile?.organization_id || "",
    recordType: "incidentes",
    recordId: incidentId,
    fileName: incident
      ? `investigacion-incidente-${format(new Date(incident.fecha + "T12:00:00"), "yyyy-MM-dd")}.pdf`
      : undefined,
  })

  const resetCasualtyForm = () => {
    setCasualtyNombre("")
    setCasualtyTipo("")
    setCasualtyDias(0)
  }

  const load = useCallback(async () => {
    if (!profile?.organization_id || !incidentId) {
      setLoading(false)
      return
    }

    const orgId = profile.organization_id
    const supabase = createClient()

    const [incidentRes, causesRes, casualtiesRes, allIncidentsRes] =
      await Promise.all([
        supabase
          .from("incidents")
          .select(
            `*,
            client:clients(*),
            establishment:establishments(*),
            sector:sectors(*),
            investigador:profiles(*, credentials:professional_credentials(*)),
            causes:incident_causes(*),
            casualties:incident_casualties(*)`
          )
          .eq("id", incidentId)
          .single(),
        supabase
          .from("incident_causes")
          .select("*")
          .eq("incident_id", incidentId)
          .order("created_at"),
        supabase
          .from("incident_casualties")
          .select("*")
          .eq("incident_id", incidentId)
          .order("created_at"),
        supabase
          .from("incidents")
          .select("id, tipo, dias_perdidos, fecha")
          .eq("organization_id", orgId),
      ])

    if (incidentRes.error) {
      toast.error(
        "Incidente no encontrado: " + incidentRes.error.message
      )
      router.push("/incidentes")
      return
    }

    setIncident(incidentRes.data as Incident)
    setCauses((causesRes.data as IncidentCause[]) || [])
    setCasualties((casualtiesRes.data as IncidentCasualty[]) || [])
    setAllIncidents((allIncidentsRes.data as Incident[]) || [])
    setLoading(false)
  }, [profile?.organization_id, incidentId, router])

  useEffect(() => {
    load()
  }, [load])

  // --- Grouped causes by grupo ---
  const causesByGroup = useMemo(() => {
    const groups: Record<string, IncidentCause[]> = {}
    for (const cause of causes) {
      const g = cause.grupo
      if (!groups[g]) groups[g] = []
      groups[g].push(cause)
    }
    return groups
  }, [causes])

  // --- PDF generation ---
  const handleGeneratePDF = async () => {
    if (!incident || !organization) return
    const incidentWithRelations = {
      ...incident,
      causes,
      casualties,
    }
    const doc = (
      <InvestigacionIncidentePDF
        incident={incidentWithRelations}
        organization={organization}
      />
    )
    await generatePDF(doc as any)
  }

  // --- Status transitions ---
  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!incident) return
    const supabase = createClient()
    const updateData: Record<string, unknown> = { status: newStatus }

    if (
      newStatus === "en_investigacion" &&
      profile?.id &&
      !incident.investigador_id
    ) {
      updateData.investigador_id = profile.id
      updateData.fecha_investigacion = new Date().toISOString().split("T")[0]
    }

    const { error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", incident.id)

    if (error) {
      toast.error("Error al actualizar estado: " + error.message)
      return
    }

    toast.success(
      newStatus === "en_investigacion"
        ? "Investigación iniciada"
        : newStatus === "cerrado"
          ? "Investigación cerrada"
          : "Estado actualizado"
    )
    load()
  }

  // --- Delete incident ---
  const handleDelete = async () => {
    if (!incident) return
    const supabase = createClient()

    const { error } = await supabase
      .from("incidents")
      .delete()
      .eq("id", incident.id)

    if (error) {
      toast.error("Error al eliminar incidente: " + error.message)
      return
    }
    toast.success("Incidente eliminado")
    router.push("/incidentes")
  }

  // --- Add casualty ---
  const handleAddCasualty = async () => {
    if (!casualtyNombre || !casualtyTipo) return
    setCasualtyCreating(true)
    const supabase = createClient()

    const { error } = await supabase.from("incident_casualties").insert({
      incident_id: incidentId,
      nombre: casualtyNombre,
      tipo: casualtyTipo,
      dias_perdidos: casualtyDias,
    })

    if (error) {
      toast.error("Error al agregar damnificado: " + error.message)
      setCasualtyCreating(false)
      return
    }

    toast.success("Damnificado agregado")
    resetCasualtyForm()
    setAddCasualtyOpen(false)
    setCasualtyCreating(false)
    load()
  }

  // --- Delete casualty ---
  const deleteCasualty = async (casualtyId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("incident_casualties")
      .delete()
      .eq("id", casualtyId)

    if (error) {
      toast.error("Error al eliminar damnificado: " + error.message)
      return
    }
    toast.success("Damnificado eliminado")
    load()
  }

  // --- Loading state ---
  if (loading) {
    return (
      <>
        <Topbar title="Detalle de Incidente" description="Cargando..." />
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando incidente...</span>
        </div>
      </>
    )
  }

  if (!incident) return null

  const statusConfig = STATUS_CONFIG[incident.status]
  const client = incident.client as any
  const establishment = incident.establishment as any
  const sector = incident.sector as any
  const investigador = incident.investigador as any

  return (
    <>
      <Topbar
        title="Detalle de Incidente"
        description={INCIDENT_TIPOS[incident.tipo]}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/incidentes">Incidentes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {INCIDENT_TIPOS[incident.tipo]} —{" "}
                {format(
                  new Date(incident.fecha + "T12:00:00"),
                  "d MMM yyyy",
                  { locale: es }
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header: status + type badge + gravedad badge */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusConfig.variant} className="gap-1">
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              <Badge variant="outline">
                {INCIDENT_TIPOS[incident.tipo]}
              </Badge>
              {incident.gravedad && (
                <Badge
                  className={INCIDENT_GRAVEDAD_COLORS[incident.gravedad]}
                >
                  {INCIDENT_GRAVEDADES[incident.gravedad]}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm whitespace-pre-wrap">
            {incident.descripcion}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
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
            Generar PDF
          </Button>

          {incident.status === "reportado" && (
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
                onClick={() => handleStatusChange("en_investigacion")}
              >
                <Search className="h-3.5 w-3.5" />
                Iniciar Investigación
              </Button>
            </>
          )}

          {incident.status === "en_investigacion" && (
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
                onClick={() => handleStatusChange("cerrado")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cerrar Investigación
              </Button>
            </>
          )}

          {incident.status === "reportado" && (
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
                  <AlertDialogTitle>Eliminar incidente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará el incidente y todos sus datos
                    asociados (causas, damnificados). No se puede deshacer.
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

        {/* Info grid: Datos del Incidente */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base">Datos del Incidente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">
                  {format(
                    new Date(incident.fecha + "T12:00:00"),
                    "EEEE d 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Hora</p>
                <p className="text-sm font-medium">
                  {incident.hora ? incident.hora.slice(0, 5) : "No registrada"}
                </p>
              </div>
            </div>

            {incident.lugar_exacto && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Lugar exacto</p>
                  <p className="text-sm font-medium">
                    {incident.lugar_exacto}
                  </p>
                </div>
              </div>
            )}

            {incident.nombre_afectado && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Persona afectada</p>
                  <p className="text-sm font-medium">
                    {incident.nombre_afectado}
                  </p>
                </div>
              </div>
            )}

            {incident.puesto_afectado && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Puesto</p>
                  <p className="text-sm font-medium">
                    {incident.puesto_afectado}
                  </p>
                </div>
              </div>
            )}

            {incident.antiguedad_meses != null && incident.antiguedad_meses > 0 && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Antigüedad</p>
                  <p className="text-sm font-medium">
                    {incident.antiguedad_meses}{" "}
                    {incident.antiguedad_meses === 1 ? "mes" : "meses"}
                  </p>
                </div>
              </div>
            )}

            {incident.tipo_lesion && (
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de lesión</p>
                  <p className="text-sm font-medium">
                    {incident.tipo_lesion}
                  </p>
                </div>
              </div>
            )}

            {incident.parte_cuerpo && (
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Parte del cuerpo</p>
                  <p className="text-sm font-medium">
                    {incident.parte_cuerpo}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Días perdidos</p>
                <p className="text-sm font-medium">{incident.dias_perdidos}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Requirió hospitalización
                </p>
                <p className="text-sm font-medium">
                  {incident.requirio_hospitalizacion ? "Sí" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cliente / Establecimiento / Sector */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Ubicación
          </h2>
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
                {establishment?.direccion && (
                  <p className="text-xs text-muted-foreground">
                    {establishment.direccion}
                  </p>
                )}
              </div>
            </div>

            {sector?.nombre && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sector</p>
                  <p className="text-sm font-medium">{sector.nombre}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investigación */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Investigación
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {investigador?.full_name && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Investigador</p>
                  <p className="text-sm font-medium">
                    {investigador.full_name}
                  </p>
                  {investigador.credentials &&
                    investigador.credentials.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Mat. {investigador.credentials[0].numero}
                      </p>
                    )}
                </div>
              </div>
            )}

            {incident.fecha_investigacion && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Fecha de investigación
                  </p>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(incident.fecha_investigacion + "T12:00:00"),
                      "d MMM yyyy",
                      { locale: es }
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!investigador?.full_name && !incident.fecha_investigacion && (
            <p className="text-sm text-muted-foreground">
              Aún no se ha iniciado la investigación.
            </p>
          )}
        </div>

        {/* Análisis Causal */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Análisis Causal
          </h2>
          <CausalAnalysis
            incidentId={incidentId}
            causes={causes}
            onRefresh={load}
            readOnly={incident.status === "cerrado"}
          />
        </div>

        {/* Causes grouped by grupo */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Causas ({causes.length})
          </h2>

          {causes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se han registrado causas para este incidente.
            </p>
          ) : (
            <div className="space-y-4">
              {(Object.entries(causesByGroup) as [string, IncidentCause[]][]).map(
                ([grupo, groupCauses]) => (
                  <div key={grupo} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {CAUSE_GRUPOS[grupo as keyof typeof CAUSE_GRUPOS] || grupo}
                    </h3>
                    <div className="space-y-1.5">
                      {groupCauses.map((cause) => (
                        <div
                          key={cause.id}
                          className="border rounded-lg p-3 bg-muted/30 space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm">{cause.descripcion}</p>
                            {cause.es_causa_raiz && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-orange-300 text-orange-700 dark:text-orange-400"
                              >
                                Causa raíz
                              </Badge>
                            )}
                          </div>
                          {cause.medida_correctiva && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Medida correctiva:</span>{" "}
                              {cause.medida_correctiva}
                            </p>
                          )}
                          {cause.responsable && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Responsable:</span>{" "}
                              {cause.responsable}
                            </p>
                          )}
                          {cause.fecha_limite && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Fecha límite:</span>{" "}
                              {format(
                                new Date(cause.fecha_limite + "T12:00:00"),
                                "d MMM yyyy",
                                { locale: es }
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Damnificados / Casualties */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Damnificados ({casualties.length})
            </h2>
            {incident.status !== "cerrado" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddCasualtyOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            )}
          </div>

          {casualties.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay damnificados registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {casualties.map((c) => (
                <div
                  key={c.id}
                  className="border rounded-lg bg-muted/30 p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {CASUALTY_TIPOS[c.tipo]}
                      </Badge>
                      {c.dias_perdidos > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {c.dias_perdidos}{" "}
                          {c.dias_perdidos === 1
                            ? "día perdido"
                            : "días perdidos"}
                        </span>
                      )}
                    </div>
                  </div>
                  {incident.status !== "cerrado" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteCasualty(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Índices de Siniestralidad */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Índices de Siniestralidad
          </h2>
          <SinistralityIndices incidents={allIncidents} />
        </div>

        {/* Back button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/incidentes")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a incidentes
          </Button>
        </div>
      </div>

      {/* Add Casualty Dialog */}
      <Dialog
        open={addCasualtyOpen}
        onOpenChange={(v) => {
          if (!v) resetCasualtyForm()
          setAddCasualtyOpen(v)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Damnificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="casualty-nombre">Nombre</Label>
              <Input
                id="casualty-nombre"
                placeholder="Nombre completo"
                value={casualtyNombre}
                onChange={(e) => setCasualtyNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casualty-tipo">Tipo</Label>
              <Select value={casualtyTipo} onValueChange={setCasualtyTipo}>
                <SelectTrigger id="casualty-tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(CASUALTY_TIPOS) as [CasualtyTipo, string][]
                  ).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="casualty-dias">Días perdidos</Label>
              <Input
                id="casualty-dias"
                type="number"
                min={0}
                value={casualtyDias}
                onChange={(e) =>
                  setCasualtyDias(parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={
                !casualtyNombre || !casualtyTipo || casualtyCreating
              }
              onClick={handleAddCasualty}
            >
              {casualtyCreating && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Incident Dialog */}
      <IncidentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        incident={incident}
        onCreated={() => {
          setEditOpen(false)
          load()
        }}
      />
    </>
  )
}

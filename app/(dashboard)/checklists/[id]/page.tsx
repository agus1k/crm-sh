"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useChecklistStore } from "@/lib/stores/checklist-store"
import { Topbar } from "@/components/layout/topbar"
import { ChecklistFill } from "@/components/checklists/checklist-fill"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import { ChecklistPDF } from "@/lib/pdf/templates/checklist"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type {
  Checklist,
  ChecklistItem,
  ChecklistTemplateItem,
  ChecklistStatus,
  Organization,
} from "@/lib/crm-types"
import { CHECKLIST_STATUSES } from "@/lib/crm-types"
import {
  Loader2,
  ArrowLeft,
  FileDown,
  Building2,
  MapPin,
  Calendar,
  ListChecks,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Save,
  User,
  FileSignature,
  XCircle,
  MinusCircle,
} from "lucide-react"

export default function ChecklistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, organization } = useAuthStore()
  const checklistId = params.id as string

  const {
    items: storeItems,
    setTemplateItems,
    setResponse,
    getProgress,
    getScore,
    reset,
  } = useChecklistStore()

  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [templateItems, setTemplateItemsLocal] = useState<ChecklistTemplateItem[]>([])
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmSign, setConfirmSign] = useState(false)

  const isEditable = checklist?.status === "en_proceso"

  // PDF generator
  const { generating, generatePDF } = usePDFGenerator({
    organizationId: profile?.organization_id || "",
    recordType: "checklists",
    recordId: checklistId,
    fileName: `checklist-${checklist?.fecha || "draft"}.pdf`,
  })

  const handleGeneratePDF = async () => {
    if (!checklist || !organization) return
    const doc = <ChecklistPDF checklist={checklist} organization={organization} />
    await generatePDF(doc)
  }

  // Group items by section for the read-only detail view
  const groupedSections = useMemo(() => {
    if (!checklist?.items) return []
    const map = new Map<string, (ChecklistItem & { template_item?: ChecklistTemplateItem })[]>()
    const sorted = [...checklist.items].sort(
      (a, b) => (a.template_item?.orden ?? 0) - (b.template_item?.orden ?? 0)
    )
    for (const item of sorted) {
      const key = item.template_item?.seccion || "General"
      const existing = map.get(key) || []
      existing.push(item)
      map.set(key, existing)
    }
    return Array.from(map.entries())
  }, [checklist?.items])

  // Score color helper
  const scoreColor = useCallback((score: number | null) => {
    if (score == null) return "text-muted-foreground"
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }, [])

  const scoreBgColor = useCallback((score: number | null) => {
    if (score == null) return "bg-muted"
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }, [])

  // Respuesta display helper
  const respuestaDisplay = useCallback(
    (respuesta: string | null) => {
      switch (respuesta) {
        case "si":
          return {
            label: "Cumple",
            className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          }
        case "no":
          return {
            label: "No Cumple",
            className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          }
        case "na":
          return {
            label: "N/A",
            className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          }
        default:
          return {
            label: respuesta || "Sin respuesta",
            className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          }
      }
    },
    []
  )

  // ---- Data loading ----
  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    const { data: checklistData, error: checklistError } = await supabase
      .from("checklists")
      .select(`
        *,
        client:clients(*),
        establishment:establishments(*),
        sector:sectors(*),
        profesional:profiles!checklists_profesional_id_fkey(*, credentials:professional_credentials(*)),
        template:checklist_templates(*),
        items:checklist_items(*, template_item:checklist_template_items(*))
      `)
      .eq("id", checklistId)
      .single()

    if (checklistError || !checklistData) {
      toast.error("Checklist no encontrado")
      router.push("/checklists")
      return
    }

    const cl = checklistData as any
    setChecklist(cl as Checklist)
    setNotas(cl.notas || "")

    // Get template items sorted (from the nested template or from items)
    const tplItems: ChecklistTemplateItem[] = []
    const seenIds = new Set<string>()

    // Extract from template relationship if available
    if (cl.template?.checklist_template_items) {
      for (const ti of cl.template.checklist_template_items) {
        if (!seenIds.has(ti.id)) {
          tplItems.push(ti)
          seenIds.add(ti.id)
        }
      }
    }

    // Also extract from items' template_item joins
    if (cl.items) {
      for (const item of cl.items) {
        if (item.template_item && !seenIds.has(item.template_item.id)) {
          tplItems.push(item.template_item)
          seenIds.add(item.template_item.id)
        }
      }
    }

    tplItems.sort((a, b) => a.orden - b.orden)
    setTemplateItemsLocal(tplItems)
    setTemplateItems(tplItems)

    // Hydrate store with existing responses for editable mode
    if (cl.items && cl.items.length > 0) {
      for (const item of cl.items as ChecklistItem[]) {
        setResponse(item.template_item_id, item)
      }
    }

    setLoading(false)
  }, [profile?.organization_id, checklistId, router, setTemplateItems, setResponse])

  useEffect(() => {
    reset()
    load()
    return () => reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Save current responses ----
  const handleSave = async () => {
    if (!profile?.organization_id || !checklist) return
    setSaving(true)
    const supabase = createClient()

    const itemsToSave: Array<{
      checklist_id: string
      template_item_id: string
      respuesta: string | null
      observacion: string | null
    }> = []

    for (const ti of templateItems) {
      const storeItem = storeItems.get(ti.id)
      if (storeItem?.respuesta != null && storeItem.respuesta !== "") {
        itemsToSave.push({
          checklist_id: checklistId,
          template_item_id: ti.id,
          respuesta: storeItem.respuesta,
          observacion: storeItem.observacion || null,
        })
      }
    }

    await supabase
      .from("checklist_items")
      .delete()
      .eq("checklist_id", checklistId)

    if (itemsToSave.length > 0) {
      const { error } = await supabase
        .from("checklist_items")
        .insert(itemsToSave)

      if (error) {
        toast.error(`Error al guardar respuestas: ${error.message}`)
        setSaving(false)
        return
      }
    }

    await supabase
      .from("checklists")
      .update({ notas: notas.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", checklistId)

    toast.success("Respuestas guardadas")
    setSaving(false)
  }

  // ---- Complete checklist ----
  const handleComplete = async () => {
    if (!profile?.organization_id || !checklist) return
    setSaving(true)
    const supabase = createClient()

    const score = getScore()

    // Save all items
    const itemsToSave: Array<{
      checklist_id: string
      template_item_id: string
      respuesta: string | null
      observacion: string | null
    }> = []

    for (const ti of templateItems) {
      const storeItem = storeItems.get(ti.id)
      if (storeItem?.respuesta != null && storeItem.respuesta !== "") {
        itemsToSave.push({
          checklist_id: checklistId,
          template_item_id: ti.id,
          respuesta: storeItem.respuesta,
          observacion: storeItem.observacion || null,
        })
      }
    }

    await supabase
      .from("checklist_items")
      .delete()
      .eq("checklist_id", checklistId)

    if (itemsToSave.length > 0) {
      await supabase.from("checklist_items").insert(itemsToSave)
    }

    // Create auto-observations for critical failures
    const criticalFailures = templateItems.filter((ti) => {
      if (!ti.es_critico) return false
      const storeItem = storeItems.get(ti.id)
      return storeItem?.respuesta === "no"
    })

    for (const ti of criticalFailures) {
      const storeItem = storeItems.get(ti.id)

      const { data: obsData } = await supabase
        .from("observations")
        .insert({
          organization_id: checklist.organization_id,
          client_id: checklist.client_id,
          establishment_id: checklist.establishment_id,
          source_type: "checklist",
          source_id: checklistId,
          titulo: `No cumple: ${ti.pregunta}`,
          descripcion:
            storeItem?.observacion ||
            `Verificado en checklist. Ref: ${ti.normativa_ref || "N/A"}`,
          tipo: "no_conformidad",
          prioridad: "alta",
          status: "abierta",
          created_by: profile.id,
        })
        .select("id")
        .single()

      if (obsData) {
        await supabase
          .from("checklist_items")
          .update({ observation_id: obsData.id })
          .eq("checklist_id", checklistId)
          .eq("template_item_id", ti.id)
      }
    }

    // Update checklist with scores and status
    const { error } = await supabase
      .from("checklists")
      .update({
        status: "completado" as ChecklistStatus,
        score_total: score.percentage,
        items_total: score.total,
        items_cumple: score.cumple,
        items_no_cumple: score.noCumple,
        items_na: score.na,
        notas: notas.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checklistId)

    setSaving(false)
    if (error) {
      toast.error(`Error al completar checklist: ${error.message}`)
      return
    }

    const obsCount = criticalFailures.length
    toast.success(
      `Checklist completado — ${score.percentage}% cumplimiento` +
        (obsCount > 0
          ? ` — ${obsCount} observacion${obsCount !== 1 ? "es" : ""} generada${obsCount !== 1 ? "s" : ""}`
          : "")
    )
    setConfirmComplete(false)
    reset()
    load()
  }

  // ---- Sign checklist ----
  const handleSign = async () => {
    if (!checklist) return
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("checklists")
      .update({
        status: "firmado" as ChecklistStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checklistId)

    setSaving(false)
    if (error) {
      toast.error(`Error al firmar checklist: ${error.message}`)
      return
    }

    toast.success("Checklist firmado")
    setConfirmSign(false)
    reset()
    load()
  }

  // ---- Delete checklist ----
  const handleDelete = async () => {
    if (!checklist) return
    const supabase = createClient()

    // Delete linked central observations
    await supabase
      .from("observations")
      .delete()
      .eq("source_type", "checklist")
      .eq("source_id", checklist.id)

    // Delete checklist (cascades to checklist_items)
    const { error } = await supabase
      .from("checklists")
      .delete()
      .eq("id", checklist.id)

    if (error) {
      toast.error(`Error al eliminar checklist: ${error.message}`)
      return
    }
    toast.success("Checklist eliminado")
    router.push("/checklists")
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <>
        <Topbar title="Checklist" description="Cargando..." />
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando checklist...</span>
        </div>
      </>
    )
  }

  if (!checklist) return null

  const statusInfo = CHECKLIST_STATUSES[checklist.status]
  const client = checklist.client as any
  const establishment = checklist.establishment as any
  const sector = checklist.sector as any
  const profesional = checklist.profesional as any
  const template = checklist.template as any
  const scoreValue = checklist.score_total

  return (
    <>
      <Topbar
        title="Detalle de Checklist"
        description={template?.nombre || "Inspección"}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Back button + status + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/checklists")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a checklists
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={statusInfo.color}>
              {statusInfo.label}
            </Badge>

            {/* PDF button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleGeneratePDF}
              disabled={generating || checklist.status === "en_proceso"}
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Generar PDF
            </Button>

            {/* Status transitions */}
            {isEditable && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmComplete(true)}
                  disabled={saving}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completar
                </Button>
              </>
            )}
            {checklist.status === "completado" && (
              <Button
                size="sm"
                onClick={() => setConfirmSign(true)}
                disabled={saving}
                className="gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Firmar
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
                  <AlertDialogTitle>Eliminar checklist</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará el checklist, todas sus respuestas y
                    las observaciones asociadas. No se puede deshacer.
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

        {/* Header card */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">
                {template?.nombre || "Checklist"}
              </h2>
              {template?.descripcion && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.descripcion}
                </p>
              )}
              {template?.normativa && (
                <p className="text-xs text-muted-foreground">
                  Normativa: {template.normativa}
                </p>
              )}
            </div>

            {/* Score badge (only for completed/signed) */}
            {scoreValue != null && checklist.status !== "en_proceso" && (
              <div className="shrink-0 text-center">
                <div
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    scoreColor(scoreValue)
                  )}
                >
                  {Math.round(scoreValue)}%
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Cumplimiento
                </p>
              </div>
            )}
          </div>

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
                <ListChecks className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
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
                    new Date(checklist.fecha + "T12:00:00"),
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

        {/* Score summary card (completed / signed) */}
        {checklist.status !== "en_proceso" && scoreValue != null && (
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen de Cumplimiento
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-muted-foreground">Cumple</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {checklist.items_cumple}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs text-muted-foreground">No Cumple</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {checklist.items_no_cumple}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <MinusCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">N/A</span>
                </div>
                <p className="text-2xl font-bold text-muted-foreground tabular-nums">
                  {checklist.items_na}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {checklist.items_total}
                </p>
              </div>
            </div>

            {/* Percentage bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Porcentaje de cumplimiento</span>
                <span className={cn("font-bold tabular-nums", scoreColor(scoreValue))}>
                  {Math.round(scoreValue)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    scoreBgColor(scoreValue)
                  )}
                  style={{ width: `${Math.min(Math.round(scoreValue), 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Editable fill mode */}
        {isEditable && (
          <ChecklistFill
            templateItems={templateItems}
            disabled={false}
          />
        )}

        {/* Read-only items grouped by section */}
        {!isEditable && groupedSections.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Ítems del Checklist ({checklist.items?.length || 0})
            </h3>

            {groupedSections.map(([sectionName, sectionItems]) => (
              <div key={sectionName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {sectionName}
                  </h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {sectionItems.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {sectionItems.map((item, idx) => {
                    const ti = item.template_item
                    const resp = respuestaDisplay(item.respuesta)
                    const isCritical = ti?.es_critico ?? false
                    const isFailure = item.respuesta === "no"

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "border rounded-lg p-4 bg-card space-y-2",
                          isFailure && isCritical && "border-red-300 dark:border-red-800"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                              {ti?.orden ?? idx + 1}.
                            </span>
                            <p className="text-sm text-foreground">{ti?.pregunta || "Pregunta"}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isCritical && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 gap-1"
                              >
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Crítico
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px]", resp.className)}
                            >
                              {resp.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Numeric value if applicable */}
                        {ti?.tipo_respuesta === "numerico" && item.respuesta && (
                          <p className="text-xs text-muted-foreground ml-6">
                            Valor: <span className="font-medium text-foreground">{item.respuesta}</span>
                          </p>
                        )}

                        {/* Legal reference */}
                        {ti?.normativa_ref && (
                          <p className="text-[10px] text-muted-foreground ml-6">
                            Ref: {ti.normativa_ref}
                          </p>
                        )}

                        {/* Observation */}
                        {item.observacion && (
                          <div className="ml-6 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                            <span className="font-medium">Observación:</span>{" "}
                            {item.observacion}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state for items */}
        {!isEditable && groupedSections.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <ListChecks className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay ítems registrados en este checklist
            </p>
          </div>
        )}

        {/* Notes section */}
        {isEditable ? (
          <div>
            <Label className="text-xs">Notas generales</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones o notas adicionales sobre la inspección..."
              className="text-sm mt-1 min-h-[60px]"
            />
          </div>
        ) : checklist.notas ? (
          <div className="rounded-xl border bg-card p-6 space-y-2">
            <h3 className="text-sm font-semibold">Notas</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {checklist.notas}
            </p>
          </div>
        ) : null}
      </div>

      {/* Confirm complete dialog */}
      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Completar checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Se calcularán los puntajes finales y se generarán observaciones
              automáticas para los ítems críticos que no cumplan. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={saving}>
              {saving && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Completar checklist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm sign dialog */}
      <AlertDialog open={confirmSign} onOpenChange={setConfirmSign}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmar checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Al firmar el checklist se marcará como definitivo. No se podrán
              realizar más modificaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSign} disabled={saving}>
              {saving && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Firmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

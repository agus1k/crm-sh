"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  ShieldAlert,
  UserX,
  Brain,
  Factory,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { IncidentCause, CauseGrupo } from "@/lib/crm-types"
import { CAUSE_GRUPOS } from "@/lib/crm-types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CausalAnalysisProps {
  incidentId: string
  causes: IncidentCause[]
  onRefresh: () => void
  readOnly?: boolean
}

interface NewCauseForm {
  descripcion: string
  es_causa_raiz: boolean
  medida_correctiva: string
  responsable: string
  fecha_limite: string
}

const EMPTY_FORM: NewCauseForm = {
  descripcion: "",
  es_causa_raiz: false,
  medida_correctiva: "",
  responsable: "",
  fecha_limite: "",
}

const GRUPO_ICONS: Record<CauseGrupo, React.ElementType> = {
  condiciones_inseguras: ShieldAlert,
  actos_inseguros: UserX,
  factores_personales: Brain,
  factores_trabajo: Factory,
}

const GRUPO_COLORS: Record<CauseGrupo, string> = {
  condiciones_inseguras:
    "border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20",
  actos_inseguros:
    "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20",
  factores_personales:
    "border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20",
  factores_trabajo:
    "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CausalAnalysis({
  incidentId,
  causes,
  onRefresh,
  readOnly = false,
}: CausalAnalysisProps) {
  const [openSections, setOpenSections] = useState<Record<CauseGrupo, boolean>>(
    {
      condiciones_inseguras: true,
      actos_inseguros: true,
      factores_personales: true,
      factores_trabajo: true,
    }
  )
  const [addingGrupo, setAddingGrupo] = useState<CauseGrupo | null>(null)
  const [newCause, setNewCause] = useState<NewCauseForm>(EMPTY_FORM)
  const [savingCause, setSavingCause] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Group causes by grupo
  const causesByGrupo = (
    Object.keys(CAUSE_GRUPOS) as CauseGrupo[]
  ).reduce(
    (acc, grupo) => {
      acc[grupo] = causes.filter((c) => c.grupo === grupo)
      return acc
    },
    {} as Record<CauseGrupo, IncidentCause[]>
  )

  // ---------------------------------------------------------------------------
  // Add cause
  // ---------------------------------------------------------------------------

  const handleAdd = async (grupo: CauseGrupo) => {
    if (!newCause.descripcion.trim()) {
      toast.error("Ingrese una descripción para la causa")
      return
    }

    setSavingCause(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("incident_causes").insert({
        incident_id: incidentId,
        grupo,
        descripcion: newCause.descripcion.trim(),
        es_causa_raiz: newCause.es_causa_raiz,
        medida_correctiva: newCause.medida_correctiva.trim() || null,
        responsable: newCause.responsable.trim() || null,
        fecha_limite: newCause.fecha_limite || null,
      })

      if (error) throw error

      toast.success("Causa agregada")
      setNewCause(EMPTY_FORM)
      setAddingGrupo(null)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Error al agregar causa")
    } finally {
      setSavingCause(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Delete cause
  // ---------------------------------------------------------------------------

  const handleDelete = async (causeId: string) => {
    setDeletingId(causeId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("incident_causes")
        .delete()
        .eq("id", causeId)

      if (error) throw error

      toast.success("Causa eliminada")
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar causa")
    } finally {
      setDeletingId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Análisis Causal — 4 Grupos
      </h3>
      <p className="text-xs text-muted-foreground">
        Clasifique las causas del incidente según el método de los 4 grupos.
        Marque la(s) causa(s) raíz identificada(s).
      </p>

      {(Object.keys(CAUSE_GRUPOS) as CauseGrupo[]).map((grupo) => {
        const Icon = GRUPO_ICONS[grupo]
        const groupCauses = causesByGrupo[grupo]

        return (
          <Collapsible
            key={grupo}
            open={openSections[grupo]}
            onOpenChange={(open) =>
              setOpenSections((prev) => ({ ...prev, [grupo]: open }))
            }
          >
            <div
              className={cn(
                "rounded-lg border transition-colors",
                GRUPO_COLORS[grupo]
              )}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">
                    {CAUSE_GRUPOS[grupo]}
                  </span>
                  {groupCauses.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs h-5 px-1.5 bg-background/80 dark:bg-background/40"
                    >
                      {groupCauses.length}
                    </Badge>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    openSections[grupo] && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {/* Existing causes */}
                  {groupCauses.length === 0 && !addingGrupo && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Sin causas registradas en este grupo.
                    </p>
                  )}

                  {groupCauses.map((cause) => (
                    <div
                      key={cause.id}
                      className="rounded-md border bg-background dark:bg-background/60 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-snug">
                              {cause.descripcion}
                            </p>
                            {cause.es_causa_raiz && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 gap-0.5 shrink-0"
                              >
                                <Star className="h-3 w-3" />
                                Causa raíz
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDelete(cause.id)}
                            disabled={deletingId === cause.id}
                          >
                            {deletingId === cause.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Detail fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {cause.medida_correctiva && (
                          <div className="sm:col-span-3">
                            <span className="text-muted-foreground">
                              Medida correctiva:
                            </span>{" "}
                            <span className="text-foreground">
                              {cause.medida_correctiva}
                            </span>
                          </div>
                        )}
                        {cause.responsable && (
                          <div>
                            <span className="text-muted-foreground">
                              Responsable:
                            </span>{" "}
                            <span className="text-foreground">
                              {cause.responsable}
                            </span>
                          </div>
                        )}
                        {cause.fecha_limite && (
                          <div>
                            <span className="text-muted-foreground">
                              Fecha límite:
                            </span>{" "}
                            <span className="text-foreground">
                              {format(
                                new Date(cause.fecha_limite + "T12:00:00"),
                                "dd/MM/yyyy",
                                { locale: es }
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Inline add form */}
                  {!readOnly && addingGrupo === grupo && (
                    <div className="rounded-md border border-dashed bg-background dark:bg-background/60 p-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Descripción *</Label>
                        <Textarea
                          value={newCause.descripcion}
                          onChange={(e) =>
                            setNewCause((prev) => ({
                              ...prev,
                              descripcion: e.target.value,
                            }))
                          }
                          placeholder="Describa la causa identificada..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`causa-raiz-${grupo}`}
                          checked={newCause.es_causa_raiz}
                          onCheckedChange={(checked) =>
                            setNewCause((prev) => ({
                              ...prev,
                              es_causa_raiz: checked === true,
                            }))
                          }
                        />
                        <Label
                          htmlFor={`causa-raiz-${grupo}`}
                          className="text-xs"
                        >
                          Es causa raíz
                        </Label>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Medida correctiva</Label>
                        <Textarea
                          value={newCause.medida_correctiva}
                          onChange={(e) =>
                            setNewCause((prev) => ({
                              ...prev,
                              medida_correctiva: e.target.value,
                            }))
                          }
                          placeholder="Acción correctiva propuesta..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Responsable</Label>
                          <Input
                            value={newCause.responsable}
                            onChange={(e) =>
                              setNewCause((prev) => ({
                                ...prev,
                                responsable: e.target.value,
                              }))
                            }
                            placeholder="Nombre"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Fecha límite</Label>
                          <Input
                            type="date"
                            value={newCause.fecha_limite}
                            onChange={(e) =>
                              setNewCause((prev) => ({
                                ...prev,
                                fecha_limite: e.target.value,
                              }))
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleAdd(grupo)}
                          disabled={savingCause}
                          className="gap-1 text-xs"
                        >
                          {savingCause && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          Agregar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAddingGrupo(null)
                            setNewCause(EMPTY_FORM)
                          }}
                          className="text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Add button */}
                  {!readOnly && addingGrupo !== grupo && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs w-full border-dashed"
                      onClick={() => {
                        setAddingGrupo(grupo)
                        setNewCause(EMPTY_FORM)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar causa
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      })}

      {/* Summary */}
      {causes.length > 0 && (
        <div className="rounded-md bg-muted/40 dark:bg-muted/20 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{causes.length}</strong>{" "}
            {causes.length === 1 ? "causa identificada" : "causas identificadas"}
          </span>
          {causes.some((c) => c.es_causa_raiz) && (
            <span>
              Causa(s) raíz:{" "}
              <strong className="text-foreground">
                {causes.filter((c) => c.es_causa_raiz).length}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

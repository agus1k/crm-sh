"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TemplateBuilder,
  createEmptyItem,
  type TemplateItemDraft,
} from "@/components/checklists/template-builder"
import {
  ArrowLeft,
  Loader2,
  Save,
  Lock,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import type {
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistCategory,
} from "@/lib/crm-types"
import { CHECKLIST_CATEGORIES } from "@/lib/crm-types"

export default function PlantillaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuthStore()
  const templateId = params.id as string

  const [template, setTemplate] = useState<ChecklistTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [normativa, setNormativa] = useState("")
  const [categoria, setCategoria] = useState<ChecklistCategory>("personalizado")
  const [items, setItems] = useState<TemplateItemDraft[]>([])

  const isSystem = template?.is_system || false
  const isEditable = !isSystem

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    const { data, error } = await supabase
      .from("checklist_templates")
      .select("*, checklist_template_items(*)")
      .eq("id", templateId)
      .single()

    if (error || !data) {
      toast.error("Plantilla no encontrada")
      router.push("/checklists/plantillas")
      return
    }

    const tpl = data as ChecklistTemplate & {
      checklist_template_items: ChecklistTemplateItem[]
    }
    setTemplate({
      ...tpl,
      items: tpl.checklist_template_items,
    })

    setNombre(tpl.nombre)
    setDescripcion(tpl.descripcion || "")
    setNormativa(tpl.normativa || "")
    setCategoria(tpl.categoria)

    // Convert to draft items
    const sorted = [...(tpl.checklist_template_items || [])].sort(
      (a, b) => a.orden - b.orden
    )
    setItems(
      sorted.map((it) => ({
        _tempId: it.id,
        orden: it.orden,
        seccion: it.seccion || "",
        pregunta: it.pregunta,
        tipo_respuesta: it.tipo_respuesta,
        opciones: it.opciones,
        normativa_ref: it.normativa_ref || "",
        es_critico: it.es_critico,
      }))
    )

    setLoading(false)
  }, [profile?.organization_id, templateId, router])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!profile?.organization_id || !template || isSystem) return
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    // Validate items
    const invalidItems = items.filter((it) => !it.pregunta.trim())
    if (invalidItems.length > 0) {
      toast.error("Hay preguntas sin texto")
      return
    }

    setSaving(true)
    const supabase = createClient()

    // Update template metadata
    const { error: tplError } = await supabase
      .from("checklist_templates")
      .update({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        normativa: normativa.trim() || null,
        categoria,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)

    if (tplError) {
      toast.error("Error al guardar plantilla")
      console.error(tplError)
      setSaving(false)
      return
    }

    // Delete existing items and re-insert
    await supabase
      .from("checklist_template_items")
      .delete()
      .eq("template_id", templateId)

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("checklist_template_items")
        .insert(
          items.map((it) => ({
            template_id: templateId,
            orden: it.orden,
            seccion: it.seccion.trim() || null,
            pregunta: it.pregunta.trim(),
            tipo_respuesta: it.tipo_respuesta,
            opciones: it.opciones,
            normativa_ref: it.normativa_ref.trim() || null,
            es_critico: it.es_critico,
          }))
        )

      if (itemsError) {
        toast.error("Error al guardar ítems")
        console.error(itemsError)
        setSaving(false)
        return
      }
    }

    toast.success("Plantilla guardada")
    setSaving(false)
    // Reload to get fresh IDs
    load()
  }

  if (loading) {
    return (
      <>
        <Topbar title="Plantilla" description="Cargando..." />
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando plantilla...</span>
        </div>
      </>
    )
  }

  if (!template) return null

  return (
    <>
      <Topbar
        title={isSystem ? template.nombre : "Editar Plantilla"}
        description={
          isSystem
            ? "Plantilla del sistema (solo lectura)"
            : "Configurar preguntas y secciones"
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/checklists/plantillas")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          {isEditable && (
            <Button
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
          )}
        </div>

        {/* System template banner */}
        {isSystem && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
            <Shield className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Plantilla del sistema
              </p>
              <p className="text-xs text-muted-foreground">
                Esta plantilla no se puede editar. Podés usarla directamente
                al crear un checklist.
              </p>
            </div>
            <Lock className="h-4 w-4 text-blue-400 shrink-0 ml-auto" />
          </div>
        )}

        {/* Template metadata */}
        <div className="border rounded-xl p-4 space-y-4 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isSystem}
                className="text-sm mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={isSystem}
                className="text-sm mt-1 min-h-[50px]"
              />
            </div>
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as ChecklistCategory)}
                disabled={isSystem}
              >
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHECKLIST_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Normativa</Label>
              <Input
                value={normativa}
                onChange={(e) => setNormativa(e.target.value)}
                disabled={isSystem}
                placeholder="Ej: Decreto 351/79"
                className="text-sm mt-1"
              />
            </div>
          </div>
        </div>

        {/* Items builder / viewer */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Preguntas
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {items.length}
            </Badge>
          </div>

          <TemplateBuilder
            items={items}
            onChange={setItems}
            disabled={isSystem}
          />
        </div>
      </div>
    </>
  )
}

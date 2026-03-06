"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Loader2,
  ListChecks,
  Lock,
  Pencil,
  Shield,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import type {
  ChecklistTemplate,
  ChecklistCategory,
} from "@/lib/crm-types"
import { CHECKLIST_CATEGORIES } from "@/lib/crm-types"

export default function PlantillasPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // New template form
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState<ChecklistCategory>("personalizado")
  const [normativa, setNormativa] = useState("")

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()

    const { data, error } = await supabase
      .from("checklist_templates")
      .select("*, checklist_template_items(id)")
      .order("is_system", { ascending: false })
      .order("nombre")

    if (error) {
      toast.error("Error al cargar plantillas")
      console.error(error)
    }

    const mapped = (data || []).map((t: any) => ({
      ...t,
      _count: { items: t.checklist_template_items?.length || 0 },
      checklist_template_items: undefined,
    })) as ChecklistTemplate[]

    setTemplates(mapped)
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!profile?.organization_id || !nombre.trim()) return
    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("checklist_templates")
      .insert({
        organization_id: profile.organization_id,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        normativa: normativa.trim() || null,
        categoria,
        is_system: false,
        version: 1,
      })
      .select("id")
      .single()

    setSaving(false)
    if (error) {
      toast.error("Error al crear plantilla")
      console.error(error)
      return
    }

    toast.success("Plantilla creada")
    setCreateOpen(false)
    setNombre("")
    setDescripcion("")
    setCategoria("personalizado")
    setNormativa("")
    // Navigate to editor
    router.push(`/checklists/plantillas/${data.id}`)
  }

  const systemTemplates = templates.filter((t) => t.is_system)
  const customTemplates = templates.filter((t) => !t.is_system)

  return (
    <>
      <Topbar
        title="Plantillas de Checklists"
        description="Plantillas predefinidas y personalizadas para inspecciones"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {templates.length} plantilla{templates.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva plantilla</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando plantillas...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay plantillas disponibles
            </p>
          </div>
        ) : (
          <>
            {/* System templates */}
            {systemTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Plantillas del Sistema
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {systemTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onClick={() =>
                        router.push(`/checklists/plantillas/${t.id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom templates */}
            {customTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Plantillas Personalizadas
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onClick={() =>
                        router.push(`/checklists/plantillas/${t.id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {customTemplates.length === 0 && (
              <div className="text-center py-8 border rounded-xl border-dashed">
                <p className="text-sm text-muted-foreground">
                  Aún no tenés plantillas personalizadas
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Crear primera plantilla
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva plantilla</DialogTitle>
            <DialogDescription>
              Creá una plantilla personalizada de checklist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Inspección mensual oficinas"
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción breve de la plantilla..."
                className="text-sm mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as ChecklistCategory)}
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
              <Label className="text-xs">Normativa (opcional)</Label>
              <Input
                value={normativa}
                onChange={(e) => setNormativa(e.target.value)}
                placeholder="Ej: Decreto 351/79"
                className="text-sm mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving || !nombre.trim()}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Crear y editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TemplateCard({
  template,
  onClick,
}: {
  template: ChecklistTemplate
  onClick: () => void
}) {
  const catInfo = CHECKLIST_CATEGORIES[template.categoria]

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border rounded-xl p-4 transition-colors hover:border-primary/30 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2">
          {template.nombre}
        </h3>
        {template.is_system ? (
          <Lock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
        ) : (
          <Eye className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
        )}
      </div>

      {template.descripcion && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {template.descripcion}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px]">
          {catInfo?.label || template.categoria}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {template._count?.items || 0} preguntas
        </span>
        {template.normativa && (
          <span className="text-[10px] text-muted-foreground">
            &middot; {template.normativa}
          </span>
        )}
      </div>
    </button>
  )
}

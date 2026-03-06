"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Plus, Search, MoreHorizontal, Copy, Trash2, FolderKanban, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Report, Project, ReportType } from "@/lib/crm-types"
import { REPORT_TYPES, REPORT_STATUSES } from "@/lib/crm-types"
import { toast } from "sonner"

export default function InformesPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [reports, setReports] = useState<(Report & { project?: Project & { client: { razon_social: string } } })[]>([])
  const [projects, setProjects] = useState<(Project & { client: { razon_social: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newReport, setNewReport] = useState<{ title: string; type: ReportType | ""; project_id: string }>({ title: "", type: "", project_id: "" })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [repRes, projRes] = await Promise.all([
      supabase.from("reports").select("*, project:projects(*, client:clients(razon_social))").eq("organization_id", orgId).order("created_at", { ascending: false }),
      supabase.from("projects").select("*, client:clients(razon_social)").eq("organization_id", orgId).eq("status", "activo").order("name"),
    ])
    setReports((repRes.data as any[]) || [])
    setProjects((projRes.data as any[]) || [])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!profile?.organization_id || !newReport.title || !newReport.type || !newReport.project_id) return
    setSaving(true)
    const supabase = createClient()
    
    // Si es carga de fuego, redirigimos al wizard en vez de crearlo en blanco (el wizard lo creará)
    if (newReport.type === "carga_de_fuego") {
      router.push(`/informes/nuevo/carga-de-fuego?proyecto=${newReport.project_id}&titulo=${encodeURIComponent(newReport.title)}`)
      return
    }

    const { data, error } = await supabase.from("reports").insert({
      organization_id: profile.organization_id, project_id: newReport.project_id, report_type: newReport.type as ReportType, title: newReport.title, status: "borrador", form_data: {}, created_by: profile.id,
    }).select().single()

    if (error) { toast.error("Error al crear el informe"); setSaving(false); return }
    toast.success("Informe creado")
    setSaving(false); setDialogOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("reports").delete().eq("id", id)
    if (error) { toast.error("Error al eliminar el informe"); return }
    toast.success("Informe eliminado")
    load()
  }

  const handleDuplicate = async (report: Report) => {
    const supabase = createClient()
    const { error } = await supabase.from("reports").insert({
      organization_id: report.organization_id,
      project_id: report.project_id,
      report_type: report.report_type,
      title: `${report.title} (Copia)`,
      status: "borrador",
      form_data: report.form_data,
      result_data: report.result_data,
      version: 1,
      created_by: profile?.id,
    })
    if (error) { toast.error("Error al duplicar el informe"); return }
    toast.success("Informe duplicado")
    load()
  }

  const filtered = reports.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || (r.project as any)?.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || r.report_type === typeFilter
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  return (
    <>
      <Topbar title="Informes" description="Gestión de informes técnicos y estudios" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar informe..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos los tipos</SelectItem>{Object.entries(REPORT_TYPES).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(REPORT_STATUSES).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={() => { setNewReport({ title: "", type: "", project_id: "" }); setDialogOpen(true) }} className="w-full sm:w-auto gap-1.5 shrink-0"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nuevo informe</span></Button>
        </div>

        {loading ? <div className="text-center py-12 text-muted-foreground text-sm">Cargando informes...</div> : filtered.length === 0 ? (
          <div className="text-center py-16"><FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No se encontraron informes</p></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Título</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Proyecto / Cliente</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Estado</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Modificado</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-foreground">{report.title}</p></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-foreground"><FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />{(report.project as any)?.name || "—"}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-5">{(report.project as any)?.client?.razon_social}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className={`flex items-center gap-1.5 text-xs font-medium ${REPORT_TYPES[report.report_type].color}`}><FileText className="h-3.5 w-3.5" />{REPORT_TYPES[report.report_type].label}</div></td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${REPORT_STATUSES[report.status].color}`}>{REPORT_STATUSES[report.status].label}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right text-xs text-muted-foreground">{new Date(report.updated_at).toLocaleDateString("es-AR")}</td>
                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { if(report.report_type === 'carga_de_fuego') { router.push(`/informes/nuevo/carga-de-fuego?id=${report.id}`) } }}><FileText className="h-3.5 w-3.5 mr-2" />Abrir</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(report)}><Copy className="h-3.5 w-3.5 mr-2" />Duplicar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(report.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo informe</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Título *</Label><Input value={newReport.title} onChange={(e) => setNewReport((p) => ({ ...p, title: e.target.value }))} placeholder="Ej. Estudio CFD Sector A" /></div>
            <div className="space-y-1.5">
              <Label>Tipo de informe *</Label>
              <Select value={newReport.type} onValueChange={(val) => setNewReport((p) => ({ ...p, type: val as ReportType }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>{Object.entries(REPORT_TYPES).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Proyecto asociado *</Label>
              <Select value={newReport.project_id} onValueChange={(val) => setNewReport((p) => ({ ...p, project_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proyecto" /></SelectTrigger>
                <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} - {(p as any).client?.razon_social}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newReport.title || !newReport.type || !newReport.project_id}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{newReport.type === "carga_de_fuego" ? "Ir al Wizard" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

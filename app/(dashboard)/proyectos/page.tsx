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
import { FolderKanban, Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Loader2 } from "lucide-react"
import type { Project, Client } from "@/lib/crm-types"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  activo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  archivado: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default function ProyectosPage() {
  const { profile } = useAuthStore()
  const [projects, setProjects] = useState<(Project & { client?: Client })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Project>>({ name: "", description: "", client_id: "", status: "activo" })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const orgId = profile.organization_id

    const [projRes, clientRes] = await Promise.all([
      supabase.from("projects").select("*, client:clients(razon_social)").eq("organization_id", orgId).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("organization_id", orgId).eq("is_active", true).order("razon_social"),
    ])

    setProjects((projRes.data as any[]) || [])
    setClients((clientRes.data as Client[]) || [])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!profile?.organization_id || !editing.name || !editing.client_id) return
    setSaving(true)
    const supabase = createClient()

    if (editing.id) {
      const { error } = await supabase.from("projects").update({
        name: editing.name, description: editing.description, client_id: editing.client_id, status: editing.status, updated_at: new Date().toISOString(),
      }).eq("id", editing.id)
      if (error) { toast.error("Error al actualizar"); setSaving(false); return }
      toast.success("Proyecto actualizado")
    } else {
      const { error } = await supabase.from("projects").insert({
        organization_id: profile.organization_id, name: editing.name, description: editing.description, client_id: editing.client_id, status: editing.status, created_by: profile.id,
      })
      if (error) { toast.error("Error al crear"); setSaving(false); return }
      toast.success("Proyecto creado")
    }

    setSaving(false); setDialogOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("projects").update({ status: "archivado", updated_at: new Date().toISOString() }).eq("id", id)
    if (error) { toast.error("Error al archivar proyecto"); return }
    toast.success("Proyecto archivado")
    load()
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.client as any)?.razon_social?.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Topbar title="Proyectos" description="Gestión de proyectos por cliente" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => { setEditing({ name: "", description: "", client_id: "", status: "activo" }); setDialogOpen(true) }} className="gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nuevo proyecto</span></Button>
        </div>

        {loading ? <div className="text-center py-12 text-muted-foreground text-sm">Cargando proyectos...</div> : filtered.length === 0 ? (
          <div className="text-center py-16"><FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{search ? "No se encontraron proyectos" : "No hay proyectos aún"}</p></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Proyecto</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Cliente</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Estado</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-foreground">{project.name}</p></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{(project.client as any)?.razon_social || "—"}</div></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[project.status]}`}>{project.status}</span></td>
                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing({ ...project }); setDialogOpen(true) }}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Archivar</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing.id ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={editing.client_id || ""} onValueChange={(val) => setEditing((p) => ({ ...p, client_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.razon_social}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editing.name || !editing.client_id}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{editing.id ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

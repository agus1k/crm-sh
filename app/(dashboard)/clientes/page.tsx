"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Building2, Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, Phone, MapPin, Loader2, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Client } from "@/lib/crm-types"
import { toast } from "sonner"
import Link from "next/link"

const emptyClient: Partial<Client> = { razon_social: "", cuit: "", direccion: "", localidad: "", provincia: "Buenos Aires", contacto_nombre: "", contacto_email: "", contacto_telefono: "", responsable: "", notas: "" }

export default function ClientesPage() {
  const { profile } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client>>(emptyClient)
  const [saving, setSaving] = useState(false)

  const loadClients = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase.from("clients").select("*").eq("organization_id", profile.organization_id).eq("is_active", true).order("razon_social")
    setClients((data as Client[]) || [])
    setLoading(false)
  }, [profile?.organization_id])

  useEffect(() => { loadClients() }, [loadClients])

  const handleSave = async () => {
    if (!profile?.organization_id || !editingClient.razon_social) return
    setSaving(true)
    const supabase = createClient()

    if (editingClient.id) {
      const { error } = await supabase.from("clients").update({
        razon_social: editingClient.razon_social, cuit: editingClient.cuit, direccion: editingClient.direccion, localidad: editingClient.localidad, provincia: editingClient.provincia, contacto_nombre: editingClient.contacto_nombre, contacto_email: editingClient.contacto_email, contacto_telefono: editingClient.contacto_telefono, responsable: editingClient.responsable, notas: editingClient.notas, updated_at: new Date().toISOString(),
      }).eq("id", editingClient.id)
      if (error) { toast.error(`Error al actualizar: ${error.message}`); setSaving(false); return }
      toast.success("Cliente actualizado")
    } else {
      const { error } = await supabase.from("clients").insert({
        organization_id: profile.organization_id, razon_social: editingClient.razon_social, cuit: editingClient.cuit, direccion: editingClient.direccion, localidad: editingClient.localidad, provincia: editingClient.provincia, contacto_nombre: editingClient.contacto_nombre, contacto_email: editingClient.contacto_email, contacto_telefono: editingClient.contacto_telefono, responsable: editingClient.responsable, notas: editingClient.notas,
      })
      if (error) { toast.error(`Error al crear: ${error.message}`); setSaving(false); return }
      toast.success("Cliente creado")
    }
    setSaving(false); setDialogOpen(false); setEditingClient(emptyClient); loadClients()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("clients").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id)
    if (error) { toast.error("Error al eliminar cliente"); return }
    toast.success("Cliente eliminado")
    loadClients()
  }

  const filtered = clients.filter((c) => c.razon_social.toLowerCase().includes(search.toLowerCase()) || c.cuit?.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Topbar title="Clientes" description="Gestioná tus empresas y contactos" />
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => { setEditingClient(emptyClient); setDialogOpen(true) }} className="gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nuevo cliente</span></Button>
        </div>

        {loading ? <div className="text-center py-12 text-muted-foreground text-sm">Cargando clientes...</div> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{search ? "No se encontraron clientes" : "No hay clientes aún"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((client) => (
              <Link key={client.id} href={`/clientes/${client.id}`} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:border-primary/20 transition-all group block">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0"><h3 className="text-sm font-semibold text-foreground truncate">{client.razon_social}</h3>{client.cuit && <p className="text-xs text-muted-foreground mt-0.5">CUIT: {client.cuit}</p>}</div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => e.preventDefault()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); setEditingClient({ ...client }); setDialogOpen(true) }}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleDelete(client.id) }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  {client.contacto_nombre && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3 w-3 shrink-0" /><span className="truncate">{client.contacto_nombre}</span></div>}
                  {client.contacto_email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{client.contacto_email}</span></div>}
                  {client.contacto_telefono && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3 shrink-0" /><span>{client.contacto_telefono}</span></div>}
                  {client.direccion && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{`${client.direccion}, ${client.localidad}`}</span></div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingClient.id ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Razón social *</Label><Input value={editingClient.razon_social || ""} onChange={(e) => setEditingClient((p) => ({ ...p, razon_social: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>CUIT</Label><Input value={editingClient.cuit || ""} onChange={(e) => setEditingClient((p) => ({ ...p, cuit: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Responsable</Label><Input value={editingClient.responsable || ""} onChange={(e) => setEditingClient((p) => ({ ...p, responsable: e.target.value }))} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Dirección</Label><Input value={editingClient.direccion || ""} onChange={(e) => setEditingClient((p) => ({ ...p, direccion: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editingClient.razon_social}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{editingClient.id ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

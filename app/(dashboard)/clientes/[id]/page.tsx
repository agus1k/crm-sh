"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Plus,
  MapPin,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Factory,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { Client, Establishment } from "@/lib/crm-types"
import { EstablishmentForm } from "@/components/clients/establishment-form"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { profile } = useAuthStore()

  const [client, setClient] = useState<Client | null>(null)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Client>>({})

  // Establishment form state
  const [estDialogOpen, setEstDialogOpen] = useState(false)
  const [editingEst, setEditingEst] = useState<Establishment | null>(null)

  const loadClient = useCallback(async () => {
    if (!clientId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()
    if (error || !data) {
      toast.error("Cliente no encontrado")
      router.push("/clientes")
      return
    }
    setClient(data as Client)
    setEditForm(data as Client)
  }, [clientId, router])

  const loadEstablishments = useCallback(async () => {
    if (!clientId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("establishments")
      .select("*, sectors(count)")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("nombre")
    const mapped = (data || []).map((est: any) => ({
      ...est,
      _count: { sectors: est.sectors?.[0]?.count ?? 0 },
    }))
    setEstablishments(mapped as Establishment[])
  }, [clientId])

  useEffect(() => {
    Promise.all([loadClient(), loadEstablishments()]).then(() =>
      setLoading(false)
    )
  }, [loadClient, loadEstablishments])

  const handleSaveClient = async () => {
    if (!editForm.razon_social?.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("clients")
      .update({
        razon_social: editForm.razon_social,
        cuit: editForm.cuit || null,
        direccion: editForm.direccion || null,
        localidad: editForm.localidad || null,
        provincia: editForm.provincia || null,
        contacto_nombre: editForm.contacto_nombre || null,
        contacto_email: editForm.contacto_email || null,
        contacto_telefono: editForm.contacto_telefono || null,
        responsable: editForm.responsable || null,
        notas: editForm.notas || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
    if (error) {
      toast.error("Error al guardar")
      setSaving(false)
      return
    }
    toast.success("Cliente actualizado")
    setSaving(false)
    loadClient()
  }

  const handleDeleteEst = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("establishments")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      toast.error("Error al eliminar establecimiento")
      return
    }
    toast.success("Establecimiento eliminado")
    loadEstablishments()
  }

  if (loading) {
    return (
      <>
        <Topbar title="Cliente" description="Cargando..." />
        <div className="p-4 lg:p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    )
  }

  if (!client) return null

  return (
    <>
      <Topbar
        title={client.razon_social}
        description="Detalle del cliente"
      />
      <div className="p-4 lg:p-6 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/clientes">Clientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{client.razon_social}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Tabs */}
        <Tabs defaultValue="datos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="datos">Datos Generales</TabsTrigger>
            <TabsTrigger value="establecimientos">
              Establecimientos
              {establishments.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-[20px] px-1 text-xs"
                >
                  {establishments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Datos Generales */}
          <TabsContent value="datos">
            <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Razón social *</Label>
                  <Input
                    value={editForm.razon_social || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        razon_social: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CUIT</Label>
                  <Input
                    value={editForm.cuit || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, cuit: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Responsable</Label>
                  <Input
                    value={editForm.responsable || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        responsable: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Dirección</Label>
                  <Input
                    value={editForm.direccion || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        direccion: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Localidad</Label>
                  <Input
                    value={editForm.localidad || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        localidad: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Provincia</Label>
                  <Input
                    value={editForm.provincia || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        provincia: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contacto</Label>
                  <Input
                    value={editForm.contacto_nombre || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        contacto_nombre: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email de contacto</Label>
                  <Input
                    type="email"
                    value={editForm.contacto_email || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        contacto_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono de contacto</Label>
                  <Input
                    value={editForm.contacto_telefono || ""}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        contacto_telefono: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveClient}
                  disabled={saving || !editForm.razon_social?.trim()}
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Establecimientos */}
          <TabsContent value="establecimientos">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Sucursales, plantas y locaciones físicas del cliente.
                </p>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditingEst(null)
                    setEstDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Nuevo establecimiento
                  </span>
                </Button>
              </div>

              {establishments.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-xl">
                  <Factory className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No hay establecimientos aún
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agregá la primera sucursal o planta del cliente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {establishments.map((est) => (
                    <Link
                      key={est.id}
                      href={`/clientes/${clientId}/establecimientos/${est.id}`}
                      className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:border-primary/20 transition-all group block"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {est.nombre}
                          </h3>
                          {est.actividad_principal && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {est.actividad_principal}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setEditingEst(est)
                                setEstDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleDeleteEst(est.id)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-1.5">
                        {est.direccion && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {est.direccion}
                              {est.localidad ? `, ${est.localidad}` : ""}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3 shrink-0" />
                          <span>{est.cantidad_personal} personas</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>
                            {est._count?.sectors ?? 0}{" "}
                            {(est._count?.sectors ?? 0) === 1
                              ? "sector"
                              : "sectores"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Establishment Dialog */}
      <EstablishmentForm
        clientId={clientId}
        establishment={editingEst}
        open={estDialogOpen}
        onOpenChange={setEstDialogOpen}
        onSaved={loadEstablishments}
      />
    </>
  )
}

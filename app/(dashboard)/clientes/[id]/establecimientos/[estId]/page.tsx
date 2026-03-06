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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  Plus,
  MapPin,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Loader2,
  Layers,
  SquareStack,
  Ruler,
} from "lucide-react"
import { toast } from "sonner"
import type {
  Client,
  Establishment,
  DBSector,
  WorkPosition,
} from "@/lib/crm-types"
import { PROVINCIAS, VENTILACION_TYPES, TURNOS } from "@/lib/crm-types"
import { EstablishmentForm } from "@/components/clients/establishment-form"
import { SectorForm } from "@/components/clients/sector-form"
import { WorkPositionForm } from "@/components/clients/work-position-form"

export default function EstablishmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const estId = params.estId as string
  const { profile } = useAuthStore()

  const [client, setClient] = useState<Client | null>(null)
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [sectors, setSectors] = useState<(DBSector & { work_positions: WorkPosition[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit establishment form
  const [estDialogOpen, setEstDialogOpen] = useState(false)

  // Sector form state
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false)
  const [editingSector, setEditingSector] = useState<DBSector | null>(null)

  // Work position form state
  const [posDialogOpen, setPosDialogOpen] = useState(false)
  const [editingPos, setEditingPos] = useState<WorkPosition | null>(null)
  const [posForSectorId, setPosForSectorId] = useState<string>("")

  // Expanded sectors in the list
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
    new Set()
  )

  const loadClient = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()
    if (data) setClient(data as Client)
  }, [clientId])

  const loadEstablishment = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("id", estId)
      .single()
    if (error || !data) {
      toast.error("Establecimiento no encontrado")
      router.push(`/clientes/${clientId}`)
      return
    }
    setEstablishment(data as Establishment)
  }, [estId, clientId, router])

  const loadSectors = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("sectors")
      .select("*, work_positions(*)")
      .eq("establishment_id", estId)
      .eq("is_active", true)
      .order("nombre")
    setSectors(
      (data || []).map((s: any) => ({
        ...s,
        work_positions: s.work_positions || [],
      }))
    )
  }, [estId])

  useEffect(() => {
    Promise.all([loadClient(), loadEstablishment(), loadSectors()]).then(() =>
      setLoading(false)
    )
  }, [loadClient, loadEstablishment, loadSectors])

  const toggleSector = (sectorId: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev)
      if (next.has(sectorId)) next.delete(sectorId)
      else next.add(sectorId)
      return next
    })
  }

  const handleDeleteSector = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("sectors")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      toast.error("Error al eliminar sector")
      return
    }
    toast.success("Sector eliminado")
    loadSectors()
  }

  const handleDeletePosition = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("work_positions").delete().eq("id", id)
    if (error) {
      toast.error("Error al eliminar puesto")
      return
    }
    toast.success("Puesto eliminado")
    loadSectors()
  }

  if (loading) {
    return (
      <>
        <Topbar title="Establecimiento" description="Cargando..." />
        <div className="p-4 lg:p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    )
  }

  if (!establishment || !client) return null

  // Compute summary stats
  const totalPersonal = sectors.reduce(
    (sum, s) => sum + (s.cantidad_personal || 0),
    0
  )
  const totalArea = sectors.reduce(
    (sum, s) => sum + (s.superficie_m2 || 0),
    0
  )
  const totalPositions = sectors.reduce(
    (sum, s) => sum + (s.work_positions?.length || 0),
    0
  )

  return (
    <>
      <Topbar
        title={establishment.nombre}
        description={`Establecimiento de ${client.razon_social}`}
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
              <BreadcrumbLink asChild>
                <Link href={`/clientes/${clientId}`}>
                  {client.razon_social}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{establishment.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Tabs */}
        <Tabs defaultValue="sectores" className="space-y-4">
          <TabsList>
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="sectores">
              Sectores
              {sectors.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-[20px] px-1 text-xs"
                >
                  {sectors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
          </TabsList>

          {/* Tab: Datos del Establecimiento */}
          <TabsContent value="datos">
            <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">
                  Datos del establecimiento
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEstDialogOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <InfoRow label="Nombre" value={establishment.nombre} />
                <InfoRow
                  label="Actividad"
                  value={establishment.actividad_principal}
                />
                <InfoRow label="CIIU" value={establishment.ciiu} />
                <InfoRow
                  label="Personal"
                  value={
                    establishment.cantidad_personal != null
                      ? `${establishment.cantidad_personal} personas`
                      : null
                  }
                />
                <InfoRow
                  label="Superficie"
                  value={
                    establishment.superficie_total_m2 != null
                      ? `${establishment.superficie_total_m2} m²`
                      : null
                  }
                />
                <InfoRow label="Teléfono" value={establishment.telefono} />
                <InfoRow label="Email" value={establishment.email} />
                <InfoRow label="Contacto" value={establishment.contacto_nombre} />
                <InfoRow
                  label="Dirección"
                  value={[
                    establishment.direccion,
                    establishment.localidad,
                    establishment.provincia,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
                <InfoRow
                  label="Código postal"
                  value={establishment.codigo_postal}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Sectores */}
          <TabsContent value="sectores">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Áreas y sectores del establecimiento con sus puestos de
                  trabajo.
                </p>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditingSector(null)
                    setSectorDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo sector</span>
                </Button>
              </div>

              {sectors.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-xl">
                  <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No hay sectores aún
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agregá el primer sector del establecimiento.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sectors.map((sector) => {
                    const isExpanded = expandedSectors.has(sector.id)
                    return (
                      <div
                        key={sector.id}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        {/* Sector header */}
                        <div
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleSector(sector.id)}
                        >
                          <div className="shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold truncate">
                                {sector.nombre}
                              </h4>
                              {sector.nivel && (
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0"
                                >
                                  {sector.nivel.replace("_", " ")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-0.5">
                              {sector.tipo_actividad && (
                                <span className="text-xs text-muted-foreground">
                                  {sector.tipo_actividad}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {sector.cantidad_personal} personas
                              </span>
                              {sector.superficie_m2 != null && (
                                <span className="text-xs text-muted-foreground">
                                  {sector.superficie_m2} m²
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {sector.work_positions.length}{" "}
                                {sector.work_positions.length === 1
                                  ? "puesto"
                                  : "puestos"}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingSector(sector)
                                  setSectorDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Editar sector
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPosForSectorId(sector.id)
                                  setEditingPos(null)
                                  setPosDialogOpen(true)
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Agregar puesto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSector(sector.id)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Eliminar sector
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Expanded: Work Positions */}
                        {isExpanded && (
                          <div className="border-t border-border">
                            {sector.work_positions.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                  No hay puestos de trabajo en este sector.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 gap-1.5"
                                  onClick={() => {
                                    setPosForSectorId(sector.id)
                                    setEditingPos(null)
                                    setPosDialogOpen(true)
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Agregar puesto
                                </Button>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">
                                        Puesto
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Trabajadores
                                      </TableHead>
                                      <TableHead className="text-xs hidden sm:table-cell">
                                        Turno
                                      </TableHead>
                                      <TableHead className="text-xs hidden md:table-cell">
                                        Horario
                                      </TableHead>
                                      <TableHead className="text-xs w-10"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sector.work_positions.map((pos) => (
                                      <TableRow key={pos.id}>
                                        <TableCell className="text-sm font-medium">
                                          {pos.nombre}
                                          {pos.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                              {pos.descripcion}
                                            </p>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {pos.cantidad_trabajadores}
                                        </TableCell>
                                        <TableCell className="text-sm hidden sm:table-cell">
                                          {pos.turno
                                            ? TURNOS[pos.turno]?.label || pos.turno
                                            : "-"}
                                        </TableCell>
                                        <TableCell className="text-sm hidden md:table-cell">
                                          {pos.horario_desde && pos.horario_hasta
                                            ? `${pos.horario_desde.slice(0, 5)} - ${pos.horario_hasta.slice(0, 5)}`
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                              >
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setPosForSectorId(sector.id)
                                                  setEditingPos(pos)
                                                  setPosDialogOpen(true)
                                                }}
                                              >
                                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                                Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  handleDeletePosition(pos.id)
                                                }
                                                className="text-destructive"
                                              >
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                Eliminar
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {sector.work_positions.length > 0 && (
                              <div className="p-3 border-t border-border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  onClick={() => {
                                    setPosForSectorId(sector.id)
                                    setEditingPos(null)
                                    setPosDialogOpen(true)
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  Agregar puesto
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Resumen */}
          <TabsContent value="resumen">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard
                icon={Layers}
                label="Sectores"
                value={sectors.length.toString()}
              />
              <SummaryCard
                icon={Briefcase}
                label="Puestos de trabajo"
                value={totalPositions.toString()}
              />
              <SummaryCard
                icon={Users}
                label="Personal en sectores"
                value={totalPersonal.toString()}
              />
              <SummaryCard
                icon={Ruler}
                label="Superficie total sectores"
                value={totalArea > 0 ? `${totalArea} m²` : "-"}
              />
            </div>
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                Datos del establecimiento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <InfoRow
                  label="Personal declarado"
                  value={
                    establishment.cantidad_personal != null
                      ? `${establishment.cantidad_personal} personas`
                      : null
                  }
                />
                <InfoRow
                  label="Superficie declarada"
                  value={
                    establishment.superficie_total_m2 != null
                      ? `${establishment.superficie_total_m2} m²`
                      : null
                  }
                />
                <InfoRow
                  label="Actividad"
                  value={establishment.actividad_principal}
                />
                <InfoRow label="CIIU" value={establishment.ciiu} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Establishment Edit Dialog */}
      <EstablishmentForm
        clientId={clientId}
        establishment={establishment}
        open={estDialogOpen}
        onOpenChange={setEstDialogOpen}
        onSaved={() => {
          loadEstablishment()
        }}
      />

      {/* Sector Dialog */}
      <SectorForm
        establishmentId={estId}
        sector={editingSector}
        open={sectorDialogOpen}
        onOpenChange={setSectorDialogOpen}
        onSaved={loadSectors}
      />

      {/* Work Position Dialog */}
      <WorkPositionForm
        sectorId={posForSectorId}
        position={editingPos}
        open={posDialogOpen}
        onOpenChange={setPosDialogOpen}
        onSaved={loadSectors}
      />
    </>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

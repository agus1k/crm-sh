"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { REPORT_TYPES, REPORT_STATUSES, PROTOCOL_TYPES, PROTOCOL_STATUSES } from "@/lib/crm-types"
import type { Report, MeasurementProtocol } from "@/lib/crm-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Download, Search, Loader2, FileX } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type InformeItem = {
  id: string
  tipo: string
  tipoLabel: string
  titulo: string
  status: string
  statusLabel: string
  fecha: string
  pdfUrl: string | null
  source: "report" | "protocol"
}

const statusColors: Record<string, string> = {
  borrador: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  en_revision: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  enviado: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  firmado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  vencido: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function PortalInformesPage() {
  const { profile } = useAuthStore()
  const [items, setItems] = useState<InformeItem[]>([])
  const [filtered, setFiltered] = useState<InformeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("todos")

  useEffect(() => {
    const load = async () => {
      if (!profile?.organization_id) { setLoading(false); return }

      const supabase = createClient()

      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("organization_id", profile.organization_id)
      const clientIds = clients?.map((c) => c.id) || []
      if (clientIds.length === 0) { setLoading(false); return }

      // Fetch reports and protocols in parallel
      const [reportsRes, protocolsRes] = await Promise.all([
        supabase
          .from("reports")
          .select("*")
          .in("client_id", clientIds)
          .in("status", ["completado", "enviado"])
          .order("created_at", { ascending: false }),
        supabase
          .from("measurement_protocols")
          .select("*")
          .in("client_id", clientIds)
          .in("status", ["completado", "firmado"])
          .order("created_at", { ascending: false }),
      ])

      const reportItems: InformeItem[] = (reportsRes.data || []).map((r: Report) => ({
        id: r.id,
        tipo: r.report_type,
        tipoLabel: REPORT_TYPES[r.report_type]?.label || r.report_type,
        titulo: r.title,
        status: r.status,
        statusLabel: REPORT_STATUSES[r.status]?.label || r.status,
        fecha: r.created_at,
        pdfUrl: r.pdf_url,
        source: "report" as const,
      }))

      const protocolItems: InformeItem[] = (protocolsRes.data || []).map((p: MeasurementProtocol) => ({
        id: p.id,
        tipo: p.tipo,
        tipoLabel: `Protocolo ${PROTOCOL_TYPES[p.tipo]?.label || p.tipo}`,
        titulo: `Protocolo ${PROTOCOL_TYPES[p.tipo]?.label || p.tipo} - ${format(new Date(p.fecha_medicion), "dd/MM/yyyy", { locale: es })}`,
        status: p.status,
        statusLabel: PROTOCOL_STATUSES[p.status]?.label || p.status,
        fecha: p.created_at,
        pdfUrl: null,
        source: "protocol" as const,
      }))

      const all = [...reportItems, ...protocolItems].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )
      setItems(all)
      setFiltered(all)
      setLoading(false)
    }
    load()
  }, [profile?.organization_id])

  useEffect(() => {
    let result = items
    if (filterTipo !== "todos") {
      result = result.filter((i) => i.tipo === filterTipo)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) => i.titulo.toLowerCase().includes(q) || i.tipoLabel.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [search, filterTipo, items])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informes y Protocolos</h1>
        <p className="text-muted-foreground mt-1">
          Documentos completados disponibles para descarga
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(REPORT_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
            {Object.entries(PROTOCOL_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={key}>Protocolo {val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No hay informes disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los informes completados apareceran aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{item.titulo}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{item.tipoLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.fecha), "dd MMM yyyy", { locale: es })}
                    </span>
                    <Badge variant="secondary" className={statusColors[item.status] || ""}>
                      {item.statusLabel}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {item.pdfUrl ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">PDF no disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

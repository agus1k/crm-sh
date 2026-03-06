"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"
import type {
  Client,
  CentralObservationStatus,
  ObservationSourceType,
  ObservationPriority,
} from "@/lib/crm-types"
import {
  OBSERVATION_STATUSES,
  OBSERVATION_SOURCE_TYPES,
  OBSERVATION_PRIORITIES,
} from "@/lib/crm-types"

interface ObservationFiltersProps {
  clients: Client[]
  filterClient: string
  filterSourceType: string
  filterStatus: string
  filterPriority: string
  onFilterClientChange: (val: string) => void
  onFilterSourceTypeChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onFilterPriorityChange: (val: string) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function ObservationFilters({
  clients,
  filterClient,
  filterSourceType,
  filterStatus,
  filterPriority,
  onFilterClientChange,
  onFilterSourceTypeChange,
  onFilterStatusChange,
  onFilterPriorityChange,
  hasActiveFilters,
  onClearFilters,
}: ObservationFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Filtros:</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterClient} onValueChange={onFilterClientChange}>
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.razon_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSourceType} onValueChange={onFilterSourceTypeChange}>
          <SelectTrigger className="h-8 text-xs w-[150px]">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {Object.entries(OBSERVATION_SOURCE_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="h-8 text-xs w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(OBSERVATION_STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            {Object.entries(OBSERVATION_PRIORITIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onClearFilters}
          >
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}

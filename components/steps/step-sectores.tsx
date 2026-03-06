"use client"

import type { Sector, TipoActividad, ClaseVentilacion } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Layers, Plus, Trash2 } from "lucide-react"
import { ACTIVIDAD_LABELS } from "@/lib/normativa"

interface Props {
  data: Sector[]
  onChange: (data: Sector[]) => void
}

export function StepSectores({ data, onChange }: Props) {
  const addSector = () => {
    const id = `sector-${Date.now()}`
    onChange([
      ...data,
      {
        id,
        nombre: "",
        superficiem2: 0,
        tipoActividad: "deposito_1",
        claseVentilacion: "natural",
        materiales: [],
        descripcionConstructiva: "",
        tipoPiso: "",
        tipoParedes: "",
        tipoTecho: "",
        tieneInstalacionElectrica: true,
        accesos: "",
      },
    ])
  }

  const removeSector = (index: number) => {
    onChange(data.filter((_, i) => i !== index))
  }

  const updateSector = (
    index: number,
    field: keyof Sector,
    value: string | number | boolean
  ) => {
    const updated = [...data]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Sectores de Incendio
                </CardTitle>
                <CardDescription>
                  Defina los sectores del establecimiento a relevar
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSector}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Agregar Sector
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
              <Layers className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No hay sectores definidos
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Agregue al menos un sector de incendio para continuar
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addSector}>
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar Primer Sector
              </Button>
            </div>
          )}
          {data.map((sector, index) => (
            <div
              key={sector.id}
              className="flex flex-col gap-4 p-5 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Sector {index + 1}
                  {sector.nombre ? `: ${sector.nombre}` : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSector(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Nombre del Sector</Label>
                  <Input
                    placeholder="Ej: Deposito - Taller"
                    value={sector.nombre}
                    onChange={(e) =>
                      updateSector(index, "nombre", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Superficie (m2)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ej: 276"
                    value={sector.superficiem2 || ""}
                    onChange={(e) =>
                      updateSector(
                        index,
                        "superficiem2",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Actividad</Label>
                  <Select
                    value={sector.tipoActividad}
                    onValueChange={(v) =>
                      updateSector(
                        index,
                        "tipoActividad",
                        v as TipoActividad
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVIDAD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Ventilacion</Label>
                  <Select
                    value={sector.claseVentilacion}
                    onValueChange={(v) =>
                      updateSector(
                        index,
                        "claseVentilacion",
                        v as ClaseVentilacion
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="mecanica">Mecanica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Piso</Label>
                  <Input
                    placeholder="Ej: Cemento alisado"
                    value={sector.tipoPiso}
                    onChange={(e) =>
                      updateSector(index, "tipoPiso", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Paredes</Label>
                  <Input
                    placeholder="Ej: Mamposteria"
                    value={sector.tipoParedes}
                    onChange={(e) =>
                      updateSector(index, "tipoParedes", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de Techo</Label>
                  <Input
                    placeholder="Ej: Chapas galvanizadas"
                    value={sector.tipoTecho}
                    onChange={(e) =>
                      updateSector(index, "tipoTecho", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Accesos</Label>
                  <Input
                    placeholder="Ej: Porton NE y porton S"
                    value={sector.accesos}
                    onChange={(e) =>
                      updateSector(index, "accesos", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    checked={sector.tieneInstalacionElectrica}
                    onCheckedChange={(v) =>
                      updateSector(index, "tieneInstalacionElectrica", v)
                    }
                  />
                  <Label>Cuenta con instalacion electrica adecuada</Label>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label>Descripcion Constructiva (opcional)</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describa detalles constructivos adicionales del sector..."
                    value={sector.descripcionConstructiva}
                    onChange={(e) =>
                      updateSector(
                        index,
                        "descripcionConstructiva",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

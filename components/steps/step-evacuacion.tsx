"use client"

import type { Sector, DatosEvacuacion, TipoEdificio } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { DoorOpen } from "lucide-react"
import { FACTOR_OCUPACION } from "@/lib/normativa"

interface Props {
  sectores: Sector[]
  data: DatosEvacuacion[]
  onChange: (data: DatosEvacuacion[]) => void
}

export function StepEvacuacion({ sectores, data, onChange }: Props) {
  // Ensure each sector has an evacuation entry
  const ensuredData: DatosEvacuacion[] = sectores.map((sector) => {
    const existing = data.find((d) => d.sectorId === sector.id)
    if (existing) return existing
    return {
      sectorId: sector.id,
      factorOcupacionm2PorPersona:
        FACTOR_OCUPACION[sector.tipoActividad] || 30,
      tipoEdificio: "existente" as TipoEdificio,
      anchoSalidaExistentem: 0,
    }
  })

  const updateDato = (
    sectorId: string,
    field: keyof DatosEvacuacion,
    value: string | number
  ) => {
    const updated = ensuredData.map((d) => {
      if (d.sectorId === sectorId) {
        return { ...d, [field]: value }
      }
      return d
    })
    onChange(updated)
  }

  if (sectores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <DoorOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Debe definir al menos un sector primero
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {sectores.map((sector) => {
        const datos = ensuredData.find((d) => d.sectorId === sector.id)!
        return (
          <Card key={sector.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <DoorOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {sector.nombre || `Sector ${sector.id}`}
                  </CardTitle>
                  <CardDescription>
                    Datos para calculo de evacuacion - {sector.superficiem2} m2
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>
                  Factor de Ocupacion (m2/persona)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={datos.factorOcupacionm2PorPersona || ""}
                  onChange={(e) =>
                    updateDato(
                      sector.id,
                      "factorOcupacionm2PorPersona",
                      Number(e.target.value)
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Valor sugerido segun actividad:{" "}
                  {FACTOR_OCUPACION[sector.tipoActividad] || 30} m2/persona
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de Edificio</Label>
                <Select
                  value={datos.tipoEdificio}
                  onValueChange={(v) =>
                    updateDato(sector.id, "tipoEdificio", v as TipoEdificio)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="existente">Existente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ancho de Salida Existente (m)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Ej: 2.50"
                  value={datos.anchoSalidaExistentem || ""}
                  onChange={(e) =>
                    updateDato(
                      sector.id,
                      "anchoSalidaExistentem",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

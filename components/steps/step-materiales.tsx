"use client"

import type { Sector, MaterialCombustible } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { Flame, Plus, Trash2 } from "lucide-react"
import { MATERIALES_COMUNES } from "@/lib/normativa"

interface Props {
  sectores: Sector[]
  onChange: (sectores: Sector[]) => void
}

export function StepMateriales({ sectores, onChange }: Props) {
  const addMaterial = (sectorIndex: number) => {
    const updated = [...sectores]
    const sector = { ...updated[sectorIndex] }
    sector.materiales = [
      ...sector.materiales,
      {
        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nombre: "",
        pesoKg: 0,
        poderCalorificoKcalKg: 4400,
      },
    ]
    updated[sectorIndex] = sector
    onChange(updated)
  }

  const removeMaterial = (sectorIndex: number, matIndex: number) => {
    const updated = [...sectores]
    const sector = { ...updated[sectorIndex] }
    sector.materiales = sector.materiales.filter((_, i) => i !== matIndex)
    updated[sectorIndex] = sector
    onChange(updated)
  }

  const updateMaterial = (
    sectorIndex: number,
    matIndex: number,
    field: keyof MaterialCombustible,
    value: string | number
  ) => {
    const updated = [...sectores]
    const sector = { ...updated[sectorIndex] }
    const mat = { ...sector.materiales[matIndex], [field]: value }
    sector.materiales = [...sector.materiales]
    sector.materiales[matIndex] = mat
    updated[sectorIndex] = sector
    onChange(updated)
  }

  const selectPredefined = (
    sectorIndex: number,
    matIndex: number,
    nombre: string
  ) => {
    const pc = MATERIALES_COMUNES[nombre] || 4400
    const updated = [...sectores]
    const sector = { ...updated[sectorIndex] }
    const mat = {
      ...sector.materiales[matIndex],
      nombre,
      poderCalorificoKcalKg: pc,
    }
    sector.materiales = [...sector.materiales]
    sector.materiales[matIndex] = mat
    updated[sectorIndex] = sector
    onChange(updated)
  }

  if (sectores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Flame className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Debe definir al menos un sector en el paso anterior
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {sectores.map((sector, sectorIdx) => (
        <Card key={sector.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                  <Flame className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {sector.nombre || `Sector ${sectorIdx + 1}`}
                  </CardTitle>
                  <CardDescription>
                    Materiales combustibles relevados - {sector.superficiem2} m2
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addMaterial(sectorIdx)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Material
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sector.materiales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Sin materiales combustibles
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => addMaterial(sectorIdx)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Agregar Material
                </Button>
              </div>
            )}
            {/* Table header */}
            {sector.materiales.length > 0 && (
              <div className="hidden md:grid grid-cols-[1fr_1fr_120px_120px_40px] gap-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Material</span>
                <span>O seleccione de la lista</span>
                <span>Peso (Kg)</span>
                <span>P.C. (Kcal/Kg)</span>
                <span />
              </div>
            )}
            {sector.materiales.map((mat, matIdx) => (
              <div
                key={mat.id}
                className="grid gap-3 md:grid-cols-[1fr_1fr_120px_120px_40px] items-end p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex flex-col gap-1.5">
                  <Label className="md:hidden text-xs">Material</Label>
                  <Input
                    placeholder="Nombre del material"
                    value={mat.nombre}
                    onChange={(e) =>
                      updateMaterial(
                        sectorIdx,
                        matIdx,
                        "nombre",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="md:hidden text-xs">Material predefinido</Label>
                  <Select
                    value=""
                    onValueChange={(v) =>
                      selectPredefined(sectorIdx, matIdx, v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Material predefinido..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MATERIALES_COMUNES)
                        .filter(([, pc]) => pc > 0)
                        .map(([name, pc]) => (
                          <SelectItem key={name} value={name}>
                            {name} ({pc.toLocaleString()} Kcal/Kg)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="md:hidden text-xs">Peso (Kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Kg"
                    value={mat.pesoKg || ""}
                    onChange={(e) =>
                      updateMaterial(
                        sectorIdx,
                        matIdx,
                        "pesoKg",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="md:hidden text-xs">
                    P.C. (Kcal/Kg)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={mat.poderCalorificoKcalKg || ""}
                    onChange={(e) =>
                      updateMaterial(
                        sectorIdx,
                        matIdx,
                        "poderCalorificoKcalKg",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMaterial(sectorIdx, matIdx)}
                  className="text-destructive hover:text-destructive self-end"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {sector.materiales.length > 0 && (
              <div className="flex justify-end pt-2 border-t border-border">
                <div className="text-sm font-medium text-foreground">
                  Total Kcal:{" "}
                  <span className="font-mono text-primary">
                    {sector.materiales
                      .reduce(
                        (s, m) => s + m.pesoKg * m.poderCalorificoKcalKg,
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

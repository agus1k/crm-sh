"use client"

import type { Sector, ExtintorExistente, InstalacionContraIncendio } from "@/lib/types"
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
import { ShieldCheck, Plus, Trash2 } from "lucide-react"

interface Props {
  sectores: Sector[]
  extintores: ExtintorExistente[]
  instalaciones: InstalacionContraIncendio[]
  onChangeExtintores: (data: ExtintorExistente[]) => void
  onChangeInstalaciones: (data: InstalacionContraIncendio[]) => void
}

export function StepExtintores({
  sectores,
  extintores,
  instalaciones,
  onChangeExtintores,
  onChangeInstalaciones,
}: Props) {
  const addExtintor = () => {
    onChangeExtintores([
      ...extintores,
      {
        id: `ext-${Date.now()}`,
        sectorId: sectores[0]?.id || "",
        tipo: 'ABC PQS',
        capacidadKg: 5,
        cantidad: 1,
      },
    ])
  }

  const removeExtintor = (index: number) => {
    onChangeExtintores(extintores.filter((_, i) => i !== index))
  }

  const updateExtintor = (
    index: number,
    field: keyof ExtintorExistente,
    value: string | number
  ) => {
    const updated = [...extintores]
    updated[index] = { ...updated[index], [field]: value }
    onChangeExtintores(updated)
  }

  const addInstalacion = () => {
    onChangeInstalaciones([
      ...instalaciones,
      {
        tipo: "Extintor Manual",
        ubicacion: "",
        cantidad: 1,
        descripcion: "",
      },
    ])
  }

  const removeInstalacion = (index: number) => {
    onChangeInstalaciones(instalaciones.filter((_, i) => i !== index))
  }

  const updateInstalacion = (
    index: number,
    field: keyof InstalacionContraIncendio,
    value: string | number
  ) => {
    const updated = [...instalaciones]
    updated[index] = { ...updated[index], [field]: value }
    onChangeInstalaciones(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Extintores por sector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Extintores Existentes</CardTitle>
                <CardDescription>
                  Relevamiento de extintores en cada sector
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addExtintor}>
              <Plus className="h-4 w-4 mr-1.5" />
              Extintor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {extintores.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sin extintores registrados
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={addExtintor}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar
              </Button>
            </div>
          )}
          {extintores.map((ext, idx) => (
            <div
              key={ext.id}
              className="grid gap-3 md:grid-cols-[1fr_1fr_100px_100px_40px] items-end p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Sector</Label>
                <Select
                  value={ext.sectorId}
                  onValueChange={(v) => updateExtintor(idx, "sectorId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={ext.tipo}
                  onValueChange={(v) => updateExtintor(idx, "tipo", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABC PQS">ABC - PQS</SelectItem>
                    <SelectItem value="ABC HCFC">ABC - HCFC 123</SelectItem>
                    <SelectItem value="CO2">CO2</SelectItem>
                    <SelectItem value="Agua">Agua</SelectItem>
                    <SelectItem value="Espuma">Espuma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Cap. (Kg)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ext.capacidadKg || ""}
                  onChange={(e) =>
                    updateExtintor(idx, "capacidadKg", Number(e.target.value))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Cantidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={ext.cantidad || ""}
                  onChange={(e) =>
                    updateExtintor(idx, "cantidad", Number(e.target.value))
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExtintor(idx)}
                className="text-destructive hover:text-destructive self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Instalaciones fijas */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Instalaciones Fijas Contra Incendio
              </CardTitle>
              <CardDescription>
                Central de alarma, detectores, rociadores, etc.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInstalacion}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Instalacion
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {instalaciones.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin instalaciones fijas registradas (opcional)
            </p>
          )}
          {instalaciones.map((inst, idx) => (
            <div
              key={idx}
              className="grid gap-3 md:grid-cols-[1fr_1fr_80px_1fr_40px] items-end p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Tipo</Label>
                <Input
                  value={inst.tipo}
                  onChange={(e) =>
                    updateInstalacion(idx, "tipo", e.target.value)
                  }
                  placeholder="Ej: Central de alarma"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Ubicacion</Label>
                <Input
                  value={inst.ubicacion}
                  onChange={(e) =>
                    updateInstalacion(idx, "ubicacion", e.target.value)
                  }
                  placeholder="Ej: Deposito"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Cant.</Label>
                <Input
                  type="number"
                  min={0}
                  value={inst.cantidad || ""}
                  onChange={(e) =>
                    updateInstalacion(
                      idx,
                      "cantidad",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Descripcion</Label>
                <Input
                  value={inst.descripcion}
                  onChange={(e) =>
                    updateInstalacion(idx, "descripcion", e.target.value)
                  }
                  placeholder="Ej: Monitorizada con tablero general"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInstalacion(idx)}
                className="text-destructive hover:text-destructive self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

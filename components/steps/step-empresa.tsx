"use client"

import type { DatosEmpresa } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2 } from "lucide-react"

interface Props {
  data: DatosEmpresa
  onChange: (data: DatosEmpresa) => void
}

export function StepEmpresa({ data, onChange }: Props) {
  const update = (field: keyof DatosEmpresa, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Datos del Establecimiento</CardTitle>
              <CardDescription>
                Informacion general de la empresa y el establecimiento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="empresa-nombre">Razon Social / Nombre</Label>
            <Input
              id="empresa-nombre"
              placeholder="Ej: MeliSai S.R.L."
              value={data.nombre}
              onChange={(e) => update("nombre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="empresa-domicilio">Domicilio</Label>
            <Input
              id="empresa-domicilio"
              placeholder="Ej: Acceso Ulderico Cicare Km 1"
              value={data.domicilio}
              onChange={(e) => update("domicilio", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-localidad">Localidad</Label>
            <Input
              id="empresa-localidad"
              placeholder="Ej: Saladillo"
              value={data.localidad}
              onChange={(e) => update("localidad", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-provincia">Provincia</Label>
            <Input
              id="empresa-provincia"
              placeholder="Ej: Buenos Aires"
              value={data.provincia}
              onChange={(e) => update("provincia", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="empresa-actividad">Actividad Principal</Label>
            <Input
              id="empresa-actividad"
              placeholder="Ej: Comercializacion de miel y derivados (actividad apicola)"
              value={data.actividad}
              onChange={(e) => update("actividad", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-sup-predio">
              Superficie del Predio (m2)
            </Label>
            <Input
              id="empresa-sup-predio"
              type="number"
              min={0}
              placeholder="Ej: 5000"
              value={data.superficiePrediom2 || ""}
              onChange={(e) =>
                update("superficiePrediom2", Number(e.target.value))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-sup-cubierta">
              Superficie Cubierta (m2)
            </Label>
            <Input
              id="empresa-sup-cubierta"
              type="number"
              min={0}
              placeholder="Ej: 312"
              value={data.superficieCubiertam2 || ""}
              onChange={(e) =>
                update("superficieCubiertam2", Number(e.target.value))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-personal">Cantidad de Personal</Label>
            <Input
              id="empresa-personal"
              type="number"
              min={0}
              placeholder="Ej: 5"
              value={data.cantidadPersonal || ""}
              onChange={(e) =>
                update("cantidadPersonal", Number(e.target.value))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-distribucion">
              Distribucion del Personal
            </Label>
            <Input
              id="empresa-distribucion"
              placeholder="Ej: 3 operarios, 1 administrativo, 1 gerente"
              value={data.distribucionPersonal}
              onChange={(e) =>
                update("distribucionPersonal", e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-codigo">Codigo de Informe</Label>
            <Input
              id="empresa-codigo"
              placeholder="Ej: EMPR-ETCF-HYS-01"
              value={data.codigoInforme}
              onChange={(e) => update("codigoInforme", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa-anio">Anio</Label>
            <Input
              id="empresa-anio"
              type="number"
              value={data.anio}
              onChange={(e) => update("anio", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

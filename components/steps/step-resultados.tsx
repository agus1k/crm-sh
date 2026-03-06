"use client"

import type { ResultadoCompleto } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DESCRIPCION_CONDICIONES, ACTIVIDAD_LABELS } from "@/lib/normativa"
import {
  Flame,
  Shield,
  ShieldCheck,
  DoorOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileWarning,
} from "lucide-react"
import type { Sector } from "@/lib/types"

interface Props {
  resultados: ResultadoCompleto | null
  sectores: Sector[]
}

function StatusBadge({ cumple }: { cumple: boolean }) {
  return cumple ? (
    <Badge className="bg-success text-success-foreground gap-1">
      <CheckCircle2 className="h-3 w-3" />
      CUMPLE
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      NO CUMPLE
    </Badge>
  )
}

export function StepResultados({ resultados, sectores }: Props) {
  if (!resultados) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Complete los datos anteriores para ver los resultados
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Carga de Fuego */}
      {resultados.cargaFuego.map((cf) => (
        <Card key={cf.sectorId}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Carga de Fuego: {cf.sectorNombre}
                </CardTitle>
                <CardDescription>
                  Calculo segun Dec. 351/79, Anexo VII
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Kcal
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {cf.totalKcal.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Equivalente Madera
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {cf.equivalenteMaderaKg.toLocaleString()} Kg
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  Carga de Fuego
                </span>
                <span className="text-xl font-bold font-mono text-primary">
                  {cf.cargaFuegoKgm2} Kg/m2
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Riesgo (Nivel {cf.nivelRiesgo})
                </span>
                <span className="text-xl font-bold text-foreground">
                  {cf.clasificacionRiesgo}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Resistencia al Fuego */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Factor de Resistencia al Fuego (FR)</CardTitle>
              <CardDescription>Minutos requeridos de resistencia estructural</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Sector</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Ventilacion</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Factor FR</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Minutos</th>
                </tr>
              </thead>
              <tbody>
                {resultados.resistenciaFuego.map((fr) => {
                  const sector = sectores.find((s) => s.id === fr.sectorId)
                  return (
                    <tr key={fr.sectorId} className="border-b border-border/50">
                      <td className="py-2 px-3 font-medium">{sector?.nombre || fr.sectorId}</td>
                      <td className="py-2 px-3 capitalize">{sector?.claseVentilacion || "-"}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className="font-mono">
                          {fr.factorResistencia}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {fr.duracionMinutos > 0 ? `${fr.duracionMinutos} min` : "N/R"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Potencial Extintor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Potencial Extintor</CardTitle>
              <CardDescription>Requerimiento de extintores por sector</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Sector</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Potencial Req.</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Extintores Requeridos</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Existentes</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {resultados.potencialExtintor.map((pe) => {
                  const sector = sectores.find((s) => s.id === pe.sectorId)
                  return (
                    <tr key={pe.sectorId} className="border-b border-border/50">
                      <td className="py-2 px-3 font-medium">{sector?.nombre || pe.sectorId}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className="font-mono">
                          {pe.potencialCombinado}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-xs">{pe.extintoresRequeridos}</td>
                      <td className="py-2 px-3 text-xs">{pe.extintoresExistentes}</td>
                      <td className="py-2 px-3 text-center">
                        <StatusBadge cumple={pe.cumple} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Evacuacion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Evacuacion</CardTitle>
              <CardDescription>Factor de ocupacion y ancho de salida</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Sector</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Ocup. Max.</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">U.A.S.</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Ancho Min.</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Ancho Exist.</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {resultados.evacuacion.map((ev) => {
                  const sector = sectores.find((s) => s.id === ev.sectorId)
                  return (
                    <tr key={ev.sectorId} className="border-b border-border/50">
                      <td className="py-2 px-3 font-medium">{sector?.nombre || ev.sectorId}</td>
                      <td className="py-2 px-3 text-center font-mono">{ev.ocupantesMaximo}</td>
                      <td className="py-2 px-3 text-center font-mono">{ev.unidadesAnchoSalida}</td>
                      <td className="py-2 px-3 text-center font-mono">{ev.anchoMinimoRequerido} m</td>
                      <td className="py-2 px-3 text-center font-mono">{ev.anchoExistente} m</td>
                      <td className="py-2 px-3 text-center">
                        <StatusBadge cumple={ev.cumple} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Condiciones S / C / E */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileWarning className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Condiciones de Situacion, Construccion y Extincion
              </CardTitle>
              <CardDescription>
                Segun Dec. 351/79, Anexo VII, puntos 5 a 7
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resultados.condiciones.situacion.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">
                Condiciones de Situacion
              </h4>
              <div className="flex flex-col gap-2">
                {resultados.condiciones.situacion.map((c) => (
                  <p key={c} className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {DESCRIPCION_CONDICIONES[c] || c}
                  </p>
                ))}
              </div>
            </div>
          )}
          {resultados.condiciones.construccion.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">
                Condiciones de Construccion
              </h4>
              <div className="flex flex-col gap-2">
                {resultados.condiciones.construccion.map((c) => (
                  <p key={c} className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {DESCRIPCION_CONDICIONES[c] || c}
                  </p>
                ))}
              </div>
            </div>
          )}
          {resultados.condiciones.extincion.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">
                Condiciones de Extincion
              </h4>
              <div className="flex flex-col gap-2">
                {resultados.condiciones.extincion.map((c) => (
                  <p key={c} className="text-xs leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {DESCRIPCION_CONDICIONES[c] || c}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Corresponde:{" "}
              <span className="font-mono font-semibold text-foreground">
                {[
                  ...resultados.condiciones.situacion,
                  ...resultados.condiciones.construccion,
                  ...resultados.condiciones.extincion,
                ].join(", ")}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

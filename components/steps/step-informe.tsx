"use client"

import { useRef } from "react"
import type { FormState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Printer } from "lucide-react"
import { ACTIVIDAD_LABELS, DESCRIPCION_CONDICIONES, PODER_CALORIFICO_MADERA } from "@/lib/normativa"

interface Props {
  formState: FormState
}

export function StepInforme({ formState }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { empresa, profesionales, sectores, resultados, extintoresExistentes, instalacionesContraIncendio } = formState

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Estudio de Carga de Fuego - ${empresa.nombre}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; }
          .report { max-width: 210mm; margin: 0 auto; padding: 20mm 25mm; }
          .header { text-align: center; border: 2px solid #1a3a5c; padding: 20px; margin-bottom: 24px; }
          .header h1 { font-size: 18pt; font-weight: bold; color: #1a3a5c; margin-bottom: 4px; }
          .header h2 { font-size: 12pt; color: #333; margin-bottom: 2px; }
          .header .code { font-size: 9pt; color: #666; }
          .section { margin-bottom: 18px; }
          .section h3 { font-size: 13pt; font-weight: bold; color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; margin-bottom: 10px; }
          .section h4 { font-size: 11pt; font-weight: bold; margin: 10px 0 6px; }
          .section p { margin-bottom: 6px; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 10pt; }
          th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
          th { background-color: #e8eef4; font-weight: bold; color: #1a3a5c; }
          .badge-cumple { display: inline-block; background: #16a34a; color: white; padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
          .badge-no-cumple { display: inline-block; background: #dc2626; color: white; padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
          .result-box { background: #f0f4f8; border: 1px solid #ccc; padding: 8px 12px; margin: 6px 0; display: inline-block; }
          .result-box .label { font-size: 9pt; color: #666; text-transform: uppercase; }
          .result-box .value { font-size: 14pt; font-weight: bold; color: #1a3a5c; }
          .firma { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #999; }
          .firma-item { text-align: center; min-width: 30%; }
          .firma-item .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 9pt; }
          .page-break { page-break-before: always; }
          .footer { font-size: 8pt; color: #666; text-align: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; }
          @media print {
            body { margin: 0; }
            .report { padding: 15mm 20mm; }
          }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  if (!resultados) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Calcule los resultados primero para generar el informe
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const elabProf = profesionales.find((p) => p.rol === "elaboro")
  const colabProf = profesionales.find((p) => p.rol === "colaboro")
  const aprobProf = profesionales.find((p) => p.rol === "aprobo")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vista Previa del Informe</h2>
          <p className="text-sm text-muted-foreground">
            Revise el informe antes de imprimir o exportar
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / Exportar PDF
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <CardTitle className="text-sm text-primary">
            Documento listo para impresion
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            <div ref={printRef}>
              <div className="report" style={{ maxWidth: "210mm", margin: "0 auto", padding: "20px 30px", fontFamily: "'Times New Roman', serif", fontSize: "11pt", color: "#1a1a1a", lineHeight: 1.5 }}>
                {/* COVER */}
                <div style={{ textAlign: "center", border: "2px solid #1a3a5c", padding: "24px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "18pt", fontWeight: "bold", color: "#1a3a5c", marginBottom: "4px" }}>
                    ESTUDIO DE CARGA DE FUEGO
                  </h1>
                  <h2 style={{ fontSize: "12pt", color: "#333", marginBottom: "2px" }}>
                    {empresa.codigoInforme}
                  </h2>
                  <p style={{ fontSize: "9pt", color: "#666" }}>
                    Anio: {empresa.anio} | DEPARTAMENTO DE HIGIENE Y SEGURIDAD LABORAL
                  </p>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    INFORME TECNICO
                  </h3>
                  <p style={{ marginBottom: "6px" }}>
                    <strong>ESTUDIO DE CARGA DE FUEGO</strong> - DEC. 351/79 - Ley N 19.587
                  </p>
                  <p style={{ marginBottom: "4px" }}><strong>Empresa:</strong> {empresa.nombre}</p>
                  <p style={{ marginBottom: "4px" }}><strong>Domicilio:</strong> {empresa.domicilio}</p>
                  <p style={{ marginBottom: "4px" }}><strong>Localidad:</strong> {empresa.localidad}, {empresa.provincia}</p>
                  <p style={{ marginBottom: "4px" }}><strong>Actividad:</strong> {empresa.actividad}</p>
                  <p style={{ marginBottom: "4px" }}>
                    <strong>Profesionales actuantes:</strong>
                  </p>
                  {profesionales.map((p, i) => (
                    <p key={i} style={{ marginLeft: "20px", marginBottom: "2px" }}>
                      {p.nombre} - Mat.: {p.matricula}
                    </p>
                  ))}
                </div>

                {/* OBJETIVO */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    1.0 - OBJETIVO
                  </h3>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    El objetivo del estudio es detectar con razonable aproximacion, el incendio asociado y en funcion del mismo y del riesgo que presenta el establecimiento, determinar la cantidad de calor capaz de desarrollar la combustion completa de todos los materiales contenidos en el sector de incendio, a fin de determinar:
                  </p>
                  <ul style={{ marginLeft: "20px", marginBottom: "6px" }}>
                    <li>Resistencia al fuego de los elementos estructurales y constructivos.</li>
                    <li>Sectorizacion del edificio, a efectos de impedir la propagacion del fuego.</li>
                    <li>Medios de escape seguros para garantizar el salvamento de vidas.</li>
                    <li>Condiciones de incendio, para asegurar el mantenimiento de los servicios esenciales.</li>
                  </ul>
                </div>

                {/* METODO */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    2.0 - METODO UTILIZADO
                  </h3>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    Se adopta lo establecido en el Decreto 351/79 reglamentario de la Ley 19.587 &quot;Higiene y Seguridad en el Trabajo&quot;, correspondiente al Anexo VII, capitulo 18, que determina la maxima cantidad de calor desarrollado, en base a la suma de los pesos de los materiales combustibles presentes por sus respectivos poderes calorificos.
                  </p>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    Dichos materiales son referidos a un combustible &quot;standard&quot;, adoptandose la madera con un poder calorifico de {PODER_CALORIFICO_MADERA.toLocaleString()} Cal/Kg.
                  </p>
                </div>

                {/* CARACTERISTICAS */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    3.0 - CARACTERISTICAS DEL ESTABLECIMIENTO
                  </h3>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    El establecimiento esta ubicado en {empresa.domicilio}, de la localidad de {empresa.localidad}, Provincia de {empresa.provincia}. El establecimiento se encuentra dentro de un predio de {empresa.superficiePrediom2} m2 y cuenta con {empresa.superficieCubiertam2} m2 de superficie cubierta. El mismo se dedica a {empresa.actividad}.
                  </p>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    El personal esta conformado por {empresa.cantidadPersonal} integrantes, distribuidos de la siguiente manera: {empresa.distribucionPersonal}.
                  </p>

                  {sectores.map((sector, idx) => (
                    <div key={sector.id} style={{ marginTop: "12px" }}>
                      <h4 style={{ fontSize: "11pt", fontWeight: "bold", marginBottom: "6px" }}>
                        {String.fromCharCode(65 + idx)}. {sector.nombre.toUpperCase()}
                      </h4>
                      <p style={{ marginBottom: "4px", textAlign: "justify" }}>
                        El sector de referencia cuenta con piso de {sector.tipoPiso || "sin especificar"}, paredes de {sector.tipoParedes || "sin especificar"} y techo de {sector.tipoTecho || "sin especificar"}.
                        {sector.tieneInstalacionElectrica ? " Cuenta con instalacion electrica adecuada." : ""}
                        {sector.accesos ? ` Cuenta con ${sector.accesos}.` : ""}
                      </p>
                      {sector.descripcionConstructiva && (
                        <p style={{ marginBottom: "4px", textAlign: "justify" }}>{sector.descripcionConstructiva}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* INSTALACIONES CONTRA INCENDIO */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    4.0 - INSTALACIONES CONTRA INCENDIO
                  </h3>
                  {instalacionesContraIncendio.length > 0 && (
                    <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 16px", fontSize: "10pt" }}>
                      <thead>
                        <tr>
                          <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c" }}>Ubicacion</th>
                          <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c" }}>Tipo</th>
                          <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c" }}>Cant.</th>
                          <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c" }}>Descripcion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instalacionesContraIncendio.map((inst, i) => (
                          <tr key={i}>
                            <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{inst.ubicacion}</td>
                            <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{inst.tipo}</td>
                            <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "center" }}>{inst.cantidad}</td>
                            <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{inst.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* CALCULO DE CARGA DE FUEGO POR SECTOR */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    5.0 - CALCULO DE CARGA DE FUEGO
                  </h3>

                  {sectores.map((sector, sIdx) => {
                    const cf = resultados.cargaFuego.find((c) => c.sectorId === sector.id)
                    const fr = resultados.resistenciaFuego.find((r) => r.sectorId === sector.id)
                    const pe = resultados.potencialExtintor.find((p) => p.sectorId === sector.id)
                    const ev = resultados.evacuacion.find((e) => e.sectorId === sector.id)
                    if (!cf) return null
                    return (
                      <div key={sector.id} style={{ marginBottom: "20px" }}>
                        <h4 style={{ fontSize: "11pt", fontWeight: "bold", marginBottom: "8px" }}>
                          5.{sIdx + 1} - SECTOR {sector.nombre.toUpperCase()}
                        </h4>

                        {/* Materials table */}
                        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: "10pt" }}>
                          <thead>
                            <tr>
                              <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c" }}>Material</th>
                              <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c", textAlign: "right" }}>Peso (Kg)</th>
                              <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c", textAlign: "right" }}>P.C. (Kcal/Kg)</th>
                              <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", fontWeight: "bold", color: "#1a3a5c", textAlign: "right" }}>Subtotal (Kcal)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sector.materiales.map((mat) => (
                              <tr key={mat.id}>
                                <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{mat.nombre}</td>
                                <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{mat.pesoKg.toLocaleString()}</td>
                                <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{mat.poderCalorificoKcalKg.toLocaleString()}</td>
                                <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{(mat.pesoKg * mat.poderCalorificoKcalKg).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: "bold" }}>
                              <td style={{ border: "1px solid #999", padding: "6px 8px" }} colSpan={3}>TOTAL</td>
                              <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{cf.totalKcal.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Equivalente y Carga */}
                        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: "10pt" }}>
                          <tbody>
                            <tr>
                              <td style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: "bold", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>EQUIVALENTE EN MADERA (KG)</td>
                              <td style={{ border: "1px solid #999", padding: "6px 8px" }}>
                                Total Kcal = {cf.totalKcal.toLocaleString()} / {PODER_CALORIFICO_MADERA.toLocaleString()} Kcal/Kg = <strong>{cf.equivalenteMaderaKg.toLocaleString()} Kg</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: "bold", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>CARGA DE FUEGO (KG/M2)</td>
                              <td style={{ border: "1px solid #999", padding: "6px 8px" }}>
                                {cf.equivalenteMaderaKg.toLocaleString()} Kg / {sector.superficiem2} m2 = <strong>{cf.cargaFuegoKgm2} Kg/m2</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: "bold", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>CLASIFICACION DE RIESGO</td>
                              <td style={{ border: "1px solid #999", padding: "6px 8px" }}>
                                <strong>Riesgo {cf.nivelRiesgo} - {cf.clasificacionRiesgo}</strong>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* FR */}
                        {fr && (
                          <>
                            <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "14px 0 6px" }}>
                              Factor de Resistencia al Fuego (FR) - {sector.nombre}
                            </h4>
                            <p style={{ marginBottom: "6px" }}>
                              Ventilacion: {sector.claseVentilacion}. Factor de Resistencia: <strong>{fr.factorResistencia}</strong>
                              {fr.duracionMinutos > 0 ? ` (${fr.duracionMinutos} minutos)` : " (No Requerido)"}
                            </p>
                          </>
                        )}

                        {/* Potencial Extintor */}
                        {pe && (
                          <>
                            <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "14px 0 6px" }}>
                              Potencial Extintor - {sector.nombre}
                            </h4>
                            <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: "10pt" }}>
                              <thead>
                                <tr>
                                  <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>Sector</th>
                                  <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>Potencial Requerido</th>
                                  <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>Extintores Requeridos</th>
                                  <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>Extintores Existentes</th>
                                  <th style={{ border: "1px solid #999", padding: "6px 8px", backgroundColor: "#e8eef4", color: "#1a3a5c" }}>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{sector.nombre}</td>
                                  <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{pe.potencialCombinado}</td>
                                  <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{pe.extintoresRequeridos}</td>
                                  <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{pe.extintoresExistentes}</td>
                                  <td style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: "bold", color: pe.cumple ? "#16a34a" : "#dc2626" }}>
                                    {pe.cumple ? "CUMPLE" : "NO CUMPLE - AGREGAR"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        )}

                        {/* Evacuacion */}
                        {ev && (
                          <>
                            <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "14px 0 6px" }}>
                              Evacuacion - {sector.nombre}
                            </h4>
                            <p style={{ marginBottom: "4px" }}>
                              En funcion de la actividad: {ACTIVIDAD_LABELS[sector.tipoActividad] || sector.tipoActividad}
                            </p>
                            <p style={{ marginBottom: "4px" }}>
                              Factor de Ocupacion (FO) = {sector.superficiem2} m2 / {ev.factorOcupacion} m2 = <strong>{ev.ocupantesMaximo} Ocupantes como Maximo</strong>
                            </p>
                            <p style={{ marginBottom: "4px" }}>
                              Unidades de Ancho de Salida (u.a.s) = {ev.ocupantesMaximo}/100 = <strong>{ev.unidadesAnchoSalida} U.A.S.</strong>
                            </p>
                            <p style={{ marginBottom: "4px" }}>
                              Ancho minimo requerido: <strong>{ev.anchoMinimoRequerido} m</strong> | Ancho existente: <strong>{ev.anchoExistente} m</strong> |{" "}
                              <span style={{ fontWeight: "bold", color: ev.cumple ? "#16a34a" : "#dc2626" }}>
                                {ev.cumple ? "CUMPLE" : "NO CUMPLE"}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* CONDICIONES */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    6.0 - CONDICIONES DE SITUACION, CONSTRUCCION Y EXTINCION
                  </h3>
                  <p style={{ marginBottom: "6px" }}>
                    Corresponde: <strong>{[...resultados.condiciones.situacion, ...resultados.condiciones.construccion, ...resultados.condiciones.extincion].join(", ")}</strong>
                  </p>

                  {resultados.condiciones.situacion.length > 0 && (
                    <>
                      <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "10px 0 6px" }}>Condiciones de Situacion</h4>
                      {resultados.condiciones.situacion.map((c) => (
                        <p key={c} style={{ marginBottom: "4px", textAlign: "justify" }}>
                          {DESCRIPCION_CONDICIONES[c] || c}
                        </p>
                      ))}
                    </>
                  )}

                  {resultados.condiciones.construccion.length > 0 && (
                    <>
                      <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "10px 0 6px" }}>Condiciones de Construccion</h4>
                      {resultados.condiciones.construccion.map((c) => (
                        <p key={c} style={{ marginBottom: "4px", textAlign: "justify" }}>
                          {DESCRIPCION_CONDICIONES[c] || c}
                        </p>
                      ))}
                    </>
                  )}

                  {resultados.condiciones.extincion.length > 0 && (
                    <>
                      <h4 style={{ fontSize: "11pt", fontWeight: "bold", margin: "10px 0 6px" }}>Condiciones de Extincion</h4>
                      {resultados.condiciones.extincion.map((c) => (
                        <p key={c} style={{ marginBottom: "4px", textAlign: "justify" }}>
                          {DESCRIPCION_CONDICIONES[c] || c}
                        </p>
                      ))}
                    </>
                  )}
                </div>

                {/* RECOMENDACIONES */}
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "13pt", fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #1a3a5c", paddingBottom: "4px", marginBottom: "10px" }}>
                    7.0 - RECOMENDACIONES GENERALES
                  </h3>
                  <p style={{ marginBottom: "6px", textAlign: "justify" }}>
                    En funcion del informe realizado, se detallan las siguientes recomendaciones tecnicas:
                  </p>
                  <ul style={{ marginLeft: "20px", marginBottom: "6px" }}>
                    {resultados.potencialExtintor.filter((p) => !p.cumple).map((pe) => {
                      const sector = sectores.find((s) => s.id === pe.sectorId)
                      return (
                        <li key={pe.sectorId} style={{ marginBottom: "4px" }}>
                          Sector {sector?.nombre}: agregar extintores para alcanzar el potencial requerido ({pe.potencialCombinado}).
                        </li>
                      )
                    })}
                    <li style={{ marginBottom: "4px" }}>
                      Colocar carteleria de advertencia especifica del sector (cartel de salida de emergencia).
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      Colocar luz de emergencia en espacios comunes.
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      Mantener los medios de escape libres de obstaculos.
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      Capacitar al personal en el uso de extintores y plan de evacuacion.
                    </li>
                  </ul>
                </div>

                {/* FIRMAS */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #999" }}>
                  {elabProf && (
                    <div style={{ textAlign: "center", minWidth: "30%" }}>
                      <div style={{ borderTop: "1px solid #333", marginTop: "50px", paddingTop: "4px", fontSize: "9pt" }}>
                        <strong>ELABORO</strong><br />
                        {elabProf.nombre}<br />
                        Mat.: {elabProf.matricula}
                      </div>
                    </div>
                  )}
                  {colabProf && (
                    <div style={{ textAlign: "center", minWidth: "30%" }}>
                      <div style={{ borderTop: "1px solid #333", marginTop: "50px", paddingTop: "4px", fontSize: "9pt" }}>
                        <strong>COLABORO</strong><br />
                        {colabProf.nombre}<br />
                        Mat.: {colabProf.matricula}
                      </div>
                    </div>
                  )}
                  {aprobProf && (
                    <div style={{ textAlign: "center", minWidth: "30%" }}>
                      <div style={{ borderTop: "1px solid #333", marginTop: "50px", paddingTop: "4px", fontSize: "9pt" }}>
                        <strong>APROBO</strong><br />
                        {aprobProf.nombre}<br />
                        Mat.: {aprobProf.matricula}
                      </div>
                    </div>
                  )}
                  {!aprobProf && (
                    <div style={{ textAlign: "center", minWidth: "30%" }}>
                      <div style={{ borderTop: "1px solid #333", marginTop: "50px", paddingTop: "4px", fontSize: "9pt" }}>
                        <strong>APROBO</strong><br />
                        Gerencia General
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

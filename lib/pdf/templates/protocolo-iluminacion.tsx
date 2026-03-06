"use client"

import React from "react"
import { View, Text } from "@react-pdf/renderer"
import {
  PDFDocumentWrapper,
  PDFPageWrapper,
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFInfoGrid,
  PDFTable,
  PDFSignatureLine,
  PDFSummaryBox,
  formatPDFDate,
  getComplianceBadge,
} from "../pdf-engine"
import { styles, colors } from "../pdf-styles"
import type {
  Organization,
  Profile,
  ProfessionalCredential,
  MeasurementProtocol,
  MeasurementPoint,
  Client,
  Establishment,
  Instrument,
} from "@/lib/crm-types"

interface ProtocoloIluminacionPDFProps {
  protocol: MeasurementProtocol & {
    client?: Client
    establishment?: Establishment
    profesional?: Profile & { credentials?: ProfessionalCredential[] }
    instrument?: Instrument
    points?: MeasurementPoint[]
  }
  organization: Organization
}

export function ProtocoloIluminacionPDF({
  protocol,
  organization,
}: ProtocoloIluminacionPDFProps) {
  const points = protocol.points || []

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={protocol.profesional as Profile & { credentials?: ProfessionalCredential[] }}
          title="Protocolo de Medición de Iluminación"
          subtitle="Resolución SRT 84/12 - Anexo II"
        />

        {/* Datos del Protocolo */}
        <PDFSection title="1. Datos del Establecimiento">
          <PDFInfoGrid
            items={[
              { label: "Razón Social", value: protocol.client?.razon_social },
              { label: "CUIT", value: protocol.client?.cuit },
              { label: "Establecimiento", value: protocol.establishment?.nombre },
              { label: "Dirección", value: protocol.establishment?.direccion },
              { label: "Localidad", value: protocol.establishment?.localidad },
              { label: "Provincia", value: protocol.establishment?.provincia },
              { label: "Actividad", value: protocol.establishment?.actividad_principal },
              { label: "Fecha Medición", value: formatPDFDate(protocol.fecha_medicion) },
              { label: "Hora Inicio", value: protocol.hora_inicio || "-" },
              { label: "Hora Fin", value: protocol.hora_fin || "-" },
            ]}
          />
        </PDFSection>

        {/* Datos del Instrumento */}
        <PDFSection title="2. Instrumento Utilizado">
          <PDFInfoGrid
            items={[
              { label: "Instrumento", value: protocol.instrument?.nombre },
              { label: "Marca", value: protocol.instrument?.marca },
              { label: "Modelo", value: protocol.instrument?.modelo },
              { label: "N° Serie", value: protocol.instrument?.numero_serie },
            ]}
          />
          {protocol.condiciones_ambientales && (
            <View style={styles.mt8}>
              <Text style={[styles.textSm, styles.textBold]}>Condiciones Ambientales:</Text>
              <Text style={styles.textSm}>{protocol.condiciones_ambientales}</Text>
            </View>
          )}
        </PDFSection>

        {/* Resultados de Medición */}
        <PDFSection title="3. Resultados de Medición (Res. 84/12)">
          <PDFTable
            columns={[
              { key: "punto", header: "Punto", width: "6%" },
              { key: "nombre", header: "Nombre/Sector", width: "16%" },
              { key: "tipo", header: "Tipo Ilum.", width: "10%" },
              { key: "fuente", header: "Fuente", width: "10%" },
              { key: "tarea", header: "Tarea Visual", width: "14%" },
              { key: "medido", header: "Medido (lux)", width: "10%", align: "right" },
              { key: "minimo", header: "Mín. (lux)", width: "10%", align: "right" },
              { key: "uniformidad", header: "Uniformidad", width: "10%", align: "center" },
              { key: "cumple", header: "Cumple", width: "10%", align: "center" },
            ]}
            data={points.map((p) => ({
              punto: p.punto_numero || "-",
              nombre: p.punto_nombre,
              tipo: p.ilum_tipo_iluminacion || "-",
              fuente: p.ilum_tipo_fuente || "-",
              tarea: p.ilum_tarea || "-",
              medido: p.ilum_valor_medido_lux?.toString() || "-",
              minimo: p.ilum_valor_minimo_lux?.toString() || "-",
              uniformidad: p.ilum_uniformidad?.toFixed(2) || "-",
              cumple: p.cumple === true ? "SÍ" : p.cumple === false ? "NO" : "N/A",
            }))}
            showRowNumbers={false}
          />
        </PDFSection>

        {/* Resumen */}
        <PDFSummaryBox title="Resumen de Cumplimiento">
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>
                {protocol.puntos_total}
              </Text>
              <Text style={styles.textSm}>Total Puntos</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold, { color: colors.success }]}>
                {protocol.puntos_cumple}
              </Text>
              <Text style={styles.textSm}>Cumplen</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold, { color: colors.danger }]}>
                {protocol.puntos_no_cumple}
              </Text>
              <Text style={styles.textSm}>No Cumplen</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>
                {protocol.porcentaje_cumplimiento != null
                  ? `${protocol.porcentaje_cumplimiento.toFixed(0)}%`
                  : "-"}
              </Text>
              <Text style={styles.textSm}>Cumplimiento</Text>
            </View>
          </View>
        </PDFSummaryBox>

        {/* Observaciones por punto */}
        {points.some((p) => p.observacion) && (
          <PDFSection title="4. Observaciones">
            {points
              .filter((p) => p.observacion)
              .map((p, i) => (
                <Text key={i} style={[styles.textSm, styles.mb4]}>
                  • <Text style={styles.textBold}>{p.punto_nombre}:</Text> {p.observacion}
                </Text>
              ))}
          </PDFSection>
        )}

        {/* Notas */}
        {protocol.notas && (
          <PDFSection title="Notas Generales">
            <Text style={styles.textSm}>{protocol.notas}</Text>
          </PDFSection>
        )}

        {/* Firma */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
          <PDFSignatureLine
            name={protocol.profesional?.full_name || "Profesional"}
            role={`Mat. ${protocol.profesional?.matricula || "-"}`}
            label="Profesional Interviniente"
          />
          <PDFSignatureLine
            name="Responsable del Establecimiento"
            role=""
            label="Representante Empleador"
          />
        </View>

        <PDFFooter />
      </PDFPageWrapper>
    </PDFDocumentWrapper>
  )
}

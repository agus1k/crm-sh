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

interface ProtocoloRuidoPDFProps {
  protocol: MeasurementProtocol & {
    client?: Client
    establishment?: Establishment
    profesional?: Profile & { credentials?: ProfessionalCredential[] }
    instrument?: Instrument
    points?: MeasurementPoint[]
  }
  organization: Organization
}

export function ProtocoloRuidoPDF({
  protocol,
  organization,
}: ProtocoloRuidoPDFProps) {
  const points = protocol.points || []

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={protocol.profesional as Profile & { credentials?: ProfessionalCredential[] }}
          title="Protocolo de Medición de Ruido"
          subtitle="Resolución SRT 85/12 - Anexo II"
        />

        {/* Datos del Establecimiento */}
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

        {/* Instrumento */}
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

        {/* Resultados */}
        <PDFSection title="3. Resultados de Medición (Res. 85/12)">
          <PDFTable
            columns={[
              { key: "punto", header: "#", width: "5%" },
              { key: "nombre", header: "Punto/Sector", width: "18%" },
              { key: "tipoRuido", header: "Tipo Ruido", width: "12%" },
              { key: "tipoMed", header: "Tipo Med.", width: "10%" },
              { key: "medido", header: "Medido (dBA)", width: "12%", align: "right" },
              { key: "limite", header: "Límite (dBA)", width: "12%", align: "right" },
              { key: "exposicion", header: "Exp. (hs)", width: "8%", align: "center" },
              { key: "dosis", header: "Dosis", width: "8%", align: "center" },
              { key: "cumple", header: "Cumple", width: "10%", align: "center" },
            ]}
            data={points.map((p, i) => ({
              punto: p.punto_numero || i + 1,
              nombre: p.punto_nombre,
              tipoRuido: p.ruido_tipo_ruido || "-",
              tipoMed: p.ruido_tipo_medicion || "-",
              medido: p.ruido_valor_medido_dba?.toString() || "-",
              limite: p.ruido_limite_dba?.toString() || "-",
              exposicion: p.ruido_tiempo_exposicion_hs?.toString() || "-",
              dosis: p.ruido_dosis?.toFixed(2) || "-",
              cumple: p.cumple === true ? "SÍ" : p.cumple === false ? "NO" : "N/A",
            }))}
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

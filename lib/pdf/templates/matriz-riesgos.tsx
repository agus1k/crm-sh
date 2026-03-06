"use client"

import React from "react"
import { View, Text } from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"
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
  PDFNote,
  formatPDFDate,
  getRiskBadgeVariant,
} from "../pdf-engine"
import { styles, colors } from "../pdf-styles"
import type {
  Organization,
  Profile,
  ProfessionalCredential,
  RiskAssessment,
  Hazard,
  Client,
  Establishment,
  DBSector,
  WorkPosition,
  HazardCategoria,
} from "@/lib/crm-types"

const CATEGORIA_LABELS: Record<HazardCategoria, string> = {
  fisico: "Físico",
  quimico: "Químico",
  biologico: "Biológico",
  ergonomico: "Ergonómico",
  mecanico: "Mecánico",
  electrico: "Eléctrico",
  incendio: "Incendio",
  locativo: "Locativo",
  psicosocial: "Psicosocial",
  natural: "Natural",
}

const CLASIF_COLORS: Record<string, string> = {
  Tolerable: colors.tolerable,
  Moderado: colors.moderado,
  Importante: colors.importante,
  Intolerable: colors.intolerable,
}

interface MatrizRiesgosPDFProps {
  assessment: RiskAssessment & {
    client?: Client
    establishment?: Establishment
    sector?: DBSector
    profesional?: Profile & { credentials?: ProfessionalCredential[] }
    hazards?: (Hazard & { work_position?: WorkPosition })[]
  }
  organization: Organization
}

export function MatrizRiesgosPDF({
  assessment,
  organization,
}: MatrizRiesgosPDFProps) {
  const hazards = assessment.hazards || []

  // Stats
  const total = hazards.length
  const byClasif = hazards.reduce<Record<string, number>>((acc, h) => {
    const c = h.clasificacion || "Sin clasificar"
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={assessment.profesional as Profile & { credentials?: ProfessionalCredential[] }}
          title="Matriz de Riesgos"
          subtitle="Relevamiento de Riesgos Laborales"
        />

        {/* Datos */}
        <PDFSection title="1. Datos del Relevamiento">
          <PDFInfoGrid
            items={[
              { label: "Título", value: assessment.titulo },
              { label: "Cliente", value: assessment.client?.razon_social },
              { label: "Establecimiento", value: assessment.establishment?.nombre },
              { label: "Sector", value: assessment.sector?.nombre },
              { label: "Fecha", value: formatPDFDate(assessment.fecha) },
              { label: "Estado", value: assessment.status },
            ]}
          />
        </PDFSection>

        {/* Resumen */}
        <PDFSummaryBox title="Resumen de Riesgos">
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>{total}</Text>
              <Text style={styles.textSm}>Total Peligros</Text>
            </View>
            {Object.entries(byClasif).map(([clasif, count]) => (
              <View key={clasif} style={{ alignItems: "center" }}>
                <Text
                  style={[
                    styles.textLg,
                    styles.textBold,
                    { color: CLASIF_COLORS[clasif] || colors.secondary } as Style,
                  ]}
                >
                  {count}
                </Text>
                <Text style={styles.textSm}>{clasif}</Text>
              </View>
            ))}
          </View>
        </PDFSummaryBox>

        {/* Tabla de peligros */}
        <PDFSection title="2. Identificación de Peligros y Evaluación de Riesgos">
          <PDFTable
            columns={[
              { key: "factor", header: "Factor de Riesgo", width: "18%" },
              { key: "categoria", header: "Categoría", width: "10%" },
              { key: "puesto", header: "Puesto", width: "12%" },
              { key: "pe", header: "PE", width: "5%", align: "center" },
              { key: "pr", header: "PR", width: "5%", align: "center" },
              { key: "ca", header: "CA", width: "5%", align: "center" },
              { key: "ex", header: "EX", width: "5%", align: "center" },
              { key: "prob", header: "Prob.", width: "6%", align: "center" },
              { key: "sev", header: "Sev.", width: "5%", align: "center" },
              { key: "nr", header: "NR", width: "6%", align: "center" },
              { key: "clasif", header: "Clasif.", width: "10%" },
              { key: "medida", header: "Medida Correctiva", width: "13%" },
            ]}
            data={hazards.map((h) => ({
              factor: h.factor_riesgo,
              categoria: CATEGORIA_LABELS[h.categoria] || h.categoria,
              puesto: h.work_position?.nombre || "-",
              pe: h.indice_personas_expuestas ?? "-",
              pr: h.indice_procedimientos ?? "-",
              ca: h.indice_capacitacion ?? "-",
              ex: h.indice_exposicion ?? "-",
              prob: h.probabilidad?.toFixed(1) ?? "-",
              sev: h.indice_severidad ?? "-",
              nr: h.nivel_riesgo?.toFixed(0) ?? "-",
              clasif: h.clasificacion || "-",
              medida: h.medida_correctiva || "-",
            }))}
            showRowNumbers
          />
          <View style={styles.mt8}>
            <Text style={styles.textXs}>
              PE: Personas Expuestas | PR: Procedimientos | CA: Capacitación | EX: Exposición | Prob.: Probabilidad | Sev.: Severidad | NR: Nivel de Riesgo
            </Text>
          </View>
        </PDFSection>

        <PDFFooter />
      </PDFPageWrapper>

      {/* Página 2: Re-evaluación teórica */}
      {hazards.some((h) => h.nivel_riesgo_teorico != null) && (
        <PDFPageWrapper>
          <PDFSection title="3. Re-evaluación Teórica (Post-Mejora)">
            <PDFTable
              columns={[
                { key: "factor", header: "Factor de Riesgo", width: "20%" },
                { key: "nrActual", header: "NR Actual", width: "10%", align: "center" },
                { key: "clasifActual", header: "Clasif. Actual", width: "13%" },
                { key: "nrTeorico", header: "NR Teórico", width: "10%", align: "center" },
                { key: "clasifTeorica", header: "Clasif. Teórica", width: "13%" },
                { key: "reduccion", header: "Reducción", width: "10%", align: "center" },
                { key: "medida", header: "Medida Correctiva", width: "24%" },
              ]}
              data={hazards
                .filter((h) => h.nivel_riesgo_teorico != null)
                .map((h) => {
                  const reduccion =
                    h.nivel_riesgo && h.nivel_riesgo_teorico
                      ? `${(((h.nivel_riesgo - h.nivel_riesgo_teorico) / h.nivel_riesgo) * 100).toFixed(0)}%`
                      : "-"
                  return {
                    factor: h.factor_riesgo,
                    nrActual: h.nivel_riesgo?.toFixed(0) ?? "-",
                    clasifActual: h.clasificacion || "-",
                    nrTeorico: h.nivel_riesgo_teorico?.toFixed(0) ?? "-",
                    clasifTeorica: h.clasificacion_teorica || "-",
                    reduccion,
                    medida: h.medida_correctiva || "-",
                  }
                })}
              showRowNumbers
            />
          </PDFSection>

          {/* Notas */}
          {assessment.notas && (
            <PDFSection title="4. Observaciones Generales">
              <Text style={styles.textSm}>{assessment.notas}</Text>
            </PDFSection>
          )}

          {/* Firma */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
            <PDFSignatureLine
              name={assessment.profesional?.full_name || "Profesional"}
              role={`Mat. ${assessment.profesional?.matricula || "-"}`}
              label="Profesional Interviniente"
            />
            <PDFSignatureLine
              name="Responsable del Establecimiento"
              role=""
              label="Empleador"
            />
          </View>

          <PDFFooter />
        </PDFPageWrapper>
      )}
    </PDFDocumentWrapper>
  )
}

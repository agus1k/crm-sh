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
  Checklist,
  ChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Client,
  Establishment,
  DBSector,
} from "@/lib/crm-types"

interface ChecklistPDFProps {
  checklist: Checklist & {
    client?: Client
    establishment?: Establishment
    sector?: DBSector
    profesional?: Profile & { credentials?: ProfessionalCredential[] }
    template?: ChecklistTemplate
    items?: (ChecklistItem & { template_item?: ChecklistTemplateItem })[]
  }
  organization: Organization
}

export function ChecklistPDF({
  checklist,
  organization,
}: ChecklistPDFProps) {
  const items = checklist.items || []

  // Group items by section
  const sections = items.reduce<Record<string, (ChecklistItem & { template_item?: ChecklistTemplateItem })[]>>(
    (acc, item) => {
      const section = item.template_item?.seccion || "General"
      if (!acc[section]) acc[section] = []
      acc[section].push(item)
      return acc
    },
    {}
  )

  const getResponseLabel = (respuesta: string | null): string => {
    switch (respuesta) {
      case "si": return "SÍ"
      case "no": return "NO"
      case "na": return "N/A"
      default: return respuesta || "-"
    }
  }

  const getResponseColor = (respuesta: string | null): string => {
    switch (respuesta) {
      case "si": return colors.success
      case "no": return colors.danger
      default: return colors.secondary
    }
  }

  const scorePercent = checklist.items_total > 0
    ? ((checklist.items_cumple / checklist.items_total) * 100).toFixed(0)
    : "0"

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={checklist.profesional as Profile & { credentials?: ProfessionalCredential[] }}
          title="Checklist de Verificación"
          subtitle={checklist.template?.nombre || ""}
        />

        {/* Datos */}
        <PDFSection title="1. Datos del Relevamiento">
          <PDFInfoGrid
            items={[
              { label: "Plantilla", value: checklist.template?.nombre },
              { label: "Normativa", value: checklist.template?.normativa },
              { label: "Cliente", value: checklist.client?.razon_social },
              { label: "Establecimiento", value: checklist.establishment?.nombre },
              { label: "Sector", value: checklist.sector?.nombre },
              { label: "Fecha", value: formatPDFDate(checklist.fecha) },
              { label: "Estado", value: checklist.status },
            ]}
          />
        </PDFSection>

        {/* Resumen */}
        <PDFSummaryBox title="Resumen de Cumplimiento">
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>
                {checklist.items_total}
              </Text>
              <Text style={styles.textSm}>Total Ítems</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold, { color: colors.success }]}>
                {checklist.items_cumple}
              </Text>
              <Text style={styles.textSm}>Cumplen</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold, { color: colors.danger }]}>
                {checklist.items_no_cumple}
              </Text>
              <Text style={styles.textSm}>No Cumplen</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>
                {checklist.items_na}
              </Text>
              <Text style={styles.textSm}>N/A</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.textLg, styles.textBold]}>
                {scorePercent}%
              </Text>
              <Text style={styles.textSm}>Score</Text>
            </View>
          </View>
        </PDFSummaryBox>

        {/* Items by section */}
        {Object.entries(sections).map(([sectionName, sectionItems], idx) => (
          <PDFSection key={idx} title={`${idx + 2}. ${sectionName}`}>
            <PDFTable
              columns={[
                { key: "orden", header: "#", width: "5%" },
                { key: "pregunta", header: "Ítem de Verificación", width: "50%" },
                { key: "critico", header: "Crítico", width: "8%", align: "center" },
                { key: "respuesta", header: "Respuesta", width: "10%", align: "center" },
                { key: "observacion", header: "Observación", width: "27%" },
              ]}
              data={sectionItems.map((item) => ({
                orden: item.template_item?.orden || "-",
                pregunta: item.template_item?.pregunta || "-",
                critico: item.template_item?.es_critico ? "SÍ" : "",
                respuesta: getResponseLabel(item.respuesta),
                observacion: item.observacion || "",
              }))}
            />
          </PDFSection>
        ))}

        {/* Notas */}
        {checklist.notas && (
          <PDFSection title="Notas Generales">
            <Text style={styles.textSm}>{checklist.notas}</Text>
          </PDFSection>
        )}

        {/* Firma */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
          <PDFSignatureLine
            name={checklist.profesional?.full_name || "Profesional"}
            role={`Mat. ${checklist.profesional?.matricula || "-"}`}
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

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
  PDFNote,
  formatPDFDate,
} from "../pdf-engine"
import { styles, colors } from "../pdf-styles"
import type {
  Organization,
  Profile,
  ProfessionalCredential,
  Visit,
  VisitObservation,
  Client,
  Establishment,
  DBSector,
} from "@/lib/crm-types"

interface ConstanciaVisitaPDFProps {
  visit: Visit & {
    client?: Client
    establishment?: Establishment
    profesional?: Profile & { credentials?: ProfessionalCredential[] }
    observations?: (VisitObservation & { sector?: DBSector })[]
  }
  organization: Organization
}

export function ConstanciaVisitaPDF({
  visit,
  organization,
}: ConstanciaVisitaPDFProps) {
  const observations = visit.observations || []

  const getPriorityLabel = (p: string): string => {
    switch (p) {
      case "baja": return "Baja"
      case "media": return "Media"
      case "alta": return "Alta"
      case "critica": return "Crítica"
      default: return p
    }
  }

  const getTypeLabel = (t: string): string => {
    switch (t) {
      case "observacion": return "Observación"
      case "recomendacion": return "Recomendación"
      case "no_conformidad": return "No Conformidad"
      case "mejora": return "Mejora"
      default: return t
    }
  }

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={visit.profesional as Profile & { credentials?: ProfessionalCredential[] }}
          title="Constancia de Visita Técnica"
          subtitle="Servicio de Higiene y Seguridad en el Trabajo"
        />

        {/* Datos de la Visita */}
        <PDFSection title="1. Datos de la Visita">
          <PDFInfoGrid
            items={[
              { label: "Cliente", value: visit.client?.razon_social },
              { label: "CUIT", value: visit.client?.cuit },
              { label: "Establecimiento", value: visit.establishment?.nombre },
              { label: "Dirección", value: visit.establishment?.direccion },
              { label: "Fecha", value: formatPDFDate(visit.fecha) },
              { label: "Hora Ingreso", value: visit.hora_ingreso || "-" },
              { label: "Hora Egreso", value: visit.hora_egreso || "-" },
              { label: "Motivo", value: visit.motivo, fullWidth: true },
            ]}
          />
          {visit.acompanante && (
            <PDFNote text={`Acompañante: ${visit.acompanante}`} />
          )}
        </PDFSection>

        {/* Acciones Realizadas */}
        {visit.acciones_realizadas && (
          <PDFSection title="2. Acciones Realizadas">
            <Text style={styles.textSm}>{visit.acciones_realizadas}</Text>
          </PDFSection>
        )}

        {/* Observaciones */}
        {observations.length > 0 && (
          <PDFSection title="3. Observaciones y Recomendaciones">
            <PDFTable
              columns={[
                { key: "tipo", header: "Tipo", width: "15%" },
                { key: "descripcion", header: "Descripción", width: "40%" },
                { key: "sector", header: "Sector", width: "18%" },
                { key: "prioridad", header: "Prioridad", width: "12%", align: "center" },
              ]}
              data={observations.map((obs) => ({
                tipo: getTypeLabel(obs.tipo),
                descripcion: obs.descripcion,
                sector: obs.sector?.nombre || "-",
                prioridad: getPriorityLabel(obs.prioridad),
              }))}
              showRowNumbers
            />
          </PDFSection>
        )}

        {observations.length === 0 && (
          <PDFSection title="3. Observaciones y Recomendaciones">
            <Text style={[styles.textSm, styles.textMuted]}>
              No se registraron observaciones durante esta visita.
            </Text>
          </PDFSection>
        )}

        {/* Declaración formal */}
        <View style={[styles.summaryBox, styles.mt16]}>
          <Text style={styles.textSm}>
            Se deja constancia de la visita técnica realizada en el establecimiento indicado,
            en el marco del Servicio de Higiene y Seguridad en el Trabajo conforme a la
            Ley 19.587 y su Decreto Reglamentario 351/79.
          </Text>
          <Text style={[styles.textSm, styles.mt8]}>
            Las observaciones y recomendaciones detalladas precedentemente deberán ser
            atendidas en los plazos correspondientes a su nivel de prioridad.
          </Text>
        </View>

        {/* Firmas */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
          <PDFSignatureLine
            name={visit.profesional?.full_name || "Profesional"}
            role={`Mat. ${visit.profesional?.matricula || "-"}`}
            label="Profesional Interviniente"
          />
          <PDFSignatureLine
            name={visit.client?.responsable || "Responsable"}
            role="Responsable del Establecimiento"
            label="Conforme"
          />
        </View>

        <PDFFooter />
      </PDFPageWrapper>
    </PDFDocumentWrapper>
  )
}

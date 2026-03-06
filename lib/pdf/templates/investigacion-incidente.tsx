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
  PDFNote,
  formatPDFDate,
} from "../pdf-engine"
import { styles, colors } from "../pdf-styles"
import type {
  Organization,
  Profile,
  ProfessionalCredential,
  Incident,
  IncidentCause,
  IncidentCasualty,
  Client,
  Establishment,
  DBSector,
  CauseGrupo,
  IncidentTipo,
  IncidentGravedad,
} from "@/lib/crm-types"

const TIPO_LABELS: Record<IncidentTipo, string> = {
  accidente: "Accidente",
  incidente: "Incidente",
  enfermedad_profesional: "Enfermedad Profesional",
  casi_accidente: "Casi Accidente",
}

const GRAVEDAD_LABELS: Record<IncidentGravedad, string> = {
  leve: "Leve",
  moderada: "Moderada",
  grave: "Grave",
  muy_grave: "Muy Grave",
  fatal: "Fatal",
}

const GRUPO_LABELS: Record<CauseGrupo, string> = {
  condiciones_inseguras: "Condiciones Inseguras",
  actos_inseguros: "Actos Inseguros",
  factores_personales: "Factores Personales",
  factores_trabajo: "Factores del Trabajo",
}

interface InvestigacionIncidentePDFProps {
  incident: Incident & {
    client?: Client
    establishment?: Establishment
    sector?: DBSector
    investigador?: Profile & { credentials?: ProfessionalCredential[] }
    causes?: IncidentCause[]
    casualties?: IncidentCasualty[]
  }
  organization: Organization
}

export function InvestigacionIncidentePDF({
  incident,
  organization,
}: InvestigacionIncidentePDFProps) {
  const causes = incident.causes || []
  const casualties = incident.casualties || []
  const totalDiasPerdidos = casualties.reduce((sum, c) => sum + c.dias_perdidos, 0) + incident.dias_perdidos

  // Group causes by grupo
  const causesByGroup = causes.reduce<Record<string, IncidentCause[]>>((acc, c) => {
    const g = c.grupo
    if (!acc[g]) acc[g] = []
    acc[g].push(c)
    return acc
  }, {})

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={incident.investigador as Profile & { credentials?: ProfessionalCredential[] }}
          title="Investigación de Incidente"
          subtitle={TIPO_LABELS[incident.tipo] || incident.tipo}
        />

        {/* Datos del Incidente */}
        <PDFSection title="1. Datos del Incidente">
          <PDFInfoGrid
            items={[
              { label: "Tipo", value: TIPO_LABELS[incident.tipo] || incident.tipo },
              { label: "Gravedad", value: incident.gravedad ? GRAVEDAD_LABELS[incident.gravedad] : "-" },
              { label: "Fecha", value: formatPDFDate(incident.fecha) },
              { label: "Hora", value: incident.hora || "-" },
              { label: "Cliente", value: incident.client?.razon_social },
              { label: "Establecimiento", value: incident.establishment?.nombre },
              { label: "Sector", value: incident.sector?.nombre },
              { label: "Lugar Exacto", value: incident.lugar_exacto },
              { label: "Estado", value: incident.status },
            ]}
          />
        </PDFSection>

        {/* Descripción */}
        <PDFSection title="2. Descripción del Incidente">
          <Text style={styles.textSm}>{incident.descripcion}</Text>
        </PDFSection>

        {/* Datos del Afectado */}
        {(incident.nombre_afectado || incident.puesto_afectado) && (
          <PDFSection title="3. Datos del Trabajador Afectado">
            <PDFInfoGrid
              items={[
                { label: "Nombre", value: incident.nombre_afectado },
                { label: "Puesto", value: incident.puesto_afectado },
                { label: "Antigüedad", value: incident.antiguedad_meses != null ? `${incident.antiguedad_meses} meses` : null },
                { label: "Tipo de Lesión", value: incident.tipo_lesion },
                { label: "Parte del Cuerpo", value: incident.parte_cuerpo },
                { label: "Días Perdidos", value: incident.dias_perdidos },
                { label: "Hospitalización", value: incident.requirio_hospitalizacion ? "Sí" : "No" },
              ]}
            />
          </PDFSection>
        )}

        {/* Víctimas / Casualidades */}
        {casualties.length > 0 && (
          <PDFSection title="4. Damnificados">
            <PDFTable
              columns={[
                { key: "nombre", header: "Nombre", width: "35%" },
                { key: "tipo", header: "Tipo", width: "30%" },
                { key: "dias", header: "Días Perdidos", width: "20%", align: "center" },
              ]}
              data={casualties.map((c) => ({
                nombre: c.nombre,
                tipo: c.tipo === "muerte" ? "Fallecimiento"
                  : c.tipo === "incapacidad_permanente" ? "Incapacidad Permanente"
                  : c.tipo === "incapacidad_temporal" ? "Incapacidad Temporal"
                  : "Atención Médica",
                dias: c.dias_perdidos,
              }))}
              showRowNumbers
            />
            <Text style={[styles.textSm, styles.textBold, styles.mt8]}>
              Total días perdidos: {totalDiasPerdidos}
            </Text>
          </PDFSection>
        )}

        <PDFFooter />
      </PDFPageWrapper>

      {/* Análisis Causal */}
      <PDFPageWrapper>
        <PDFSection title="5. Análisis Causal">
          {Object.entries(causesByGroup).map(([grupo, groupCauses]) => (
            <View key={grupo} style={styles.mb12} wrap={false}>
              <Text style={styles.sectionSubtitle}>
                {GRUPO_LABELS[grupo as CauseGrupo] || grupo}
              </Text>
              <PDFTable
                columns={[
                  { key: "descripcion", header: "Causa", width: "40%" },
                  { key: "raiz", header: "Raíz", width: "8%", align: "center" },
                  { key: "medida", header: "Medida Correctiva", width: "30%" },
                  { key: "responsable", header: "Responsable", width: "12%" },
                  { key: "fecha", header: "Plazo", width: "10%" },
                ]}
                data={groupCauses.map((c) => ({
                  descripcion: c.descripcion,
                  raiz: c.es_causa_raiz ? "SÍ" : "",
                  medida: c.medida_correctiva || "-",
                  responsable: c.responsable || "-",
                  fecha: formatPDFDate(c.fecha_limite),
                }))}
              />
            </View>
          ))}

          {causes.length === 0 && (
            <Text style={[styles.textSm, styles.textMuted]}>
              No se han registrado causas para este incidente.
            </Text>
          )}
        </PDFSection>

        {/* Causa Raíz */}
        {causes.filter((c) => c.es_causa_raiz).length > 0 && (
          <PDFSummaryBox title="Causa Raíz Identificada">
            {causes
              .filter((c) => c.es_causa_raiz)
              .map((c, i) => (
                <View key={i} style={styles.mb4}>
                  <Text style={[styles.textSm, styles.textBold]}>
                    {GRUPO_LABELS[c.grupo] || c.grupo}:
                  </Text>
                  <Text style={styles.textSm}>{c.descripcion}</Text>
                  {c.medida_correctiva && (
                    <Text style={[styles.textSm, styles.textMuted]}>
                      Medida: {c.medida_correctiva}
                    </Text>
                  )}
                </View>
              ))}
          </PDFSummaryBox>
        )}

        {/* Investigación */}
        {incident.investigador && (
          <PDFSection title="6. Datos de la Investigación">
            <PDFInfoGrid
              items={[
                { label: "Investigador", value: incident.investigador.full_name },
                { label: "Matrícula", value: incident.investigador.matricula },
                { label: "Fecha Inv.", value: formatPDFDate(incident.fecha_investigacion) },
              ]}
            />
          </PDFSection>
        )}

        {/* Firma */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
          <PDFSignatureLine
            name={incident.investigador?.full_name || "Investigador"}
            role={`Mat. ${incident.investigador?.matricula || "-"}`}
            label="Profesional Investigador"
          />
          <PDFSignatureLine
            name="Responsable del Establecimiento"
            role=""
            label="Empleador"
          />
        </View>

        <PDFFooter />
      </PDFPageWrapper>
    </PDFDocumentWrapper>
  )
}

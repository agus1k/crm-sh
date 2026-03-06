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
import type { Organization, Profile, ProfessionalCredential } from "@/lib/crm-types"
import type { FormState } from "@/lib/types"

interface CargaDeFuegoPDFProps {
  formState: FormState
  organization: Organization
  professional?: Profile & { credentials?: ProfessionalCredential[] }
  reportDate?: string
  version?: number
}

export function CargaDeFuegoPDF({
  formState,
  organization,
  professional,
  reportDate,
  version,
}: CargaDeFuegoPDFProps) {
  const { empresa, profesionales, sectores, extintoresExistentes, datosEvacuacion, resultados } = formState

  return (
    <PDFDocumentWrapper>
      <PDFPageWrapper>
        <PDFHeader
          organization={organization}
          professional={professional}
          title="Estudio de Carga de Fuego"
          subtitle={`Decreto 351/79 - Ley 19.587`}
        />

        {/* Datos de la Empresa */}
        <PDFSection title="1. Datos de la Empresa">
          <PDFInfoGrid
            items={[
              { label: "Razón Social", value: empresa.nombre },
              { label: "Código Informe", value: empresa.codigoInforme },
              { label: "Domicilio", value: empresa.domicilio },
              { label: "Localidad", value: empresa.localidad },
              { label: "Provincia", value: empresa.provincia },
              { label: "Actividad", value: empresa.actividad },
              { label: "Sup. Predio", value: `${empresa.superficiePrediom2} m²` },
              { label: "Sup. Cubierta", value: `${empresa.superficieCubiertam2} m²` },
              { label: "Personal", value: `${empresa.cantidadPersonal} personas` },
              { label: "Año", value: empresa.anio },
            ]}
          />
          {empresa.distribucionPersonal && (
            <PDFNote text={`Distribución del personal: ${empresa.distribucionPersonal}`} />
          )}
        </PDFSection>

        {/* Profesionales */}
        <PDFSection title="2. Profesionales Intervinientes">
          <PDFTable
            columns={[
              { key: "nombre", header: "Nombre", width: "45%" },
              { key: "matricula", header: "Matrícula", width: "30%" },
              { key: "rol", header: "Rol", width: "25%" },
            ]}
            data={profesionales.map((p) => ({
              nombre: p.nombre,
              matricula: p.matricula,
              rol: p.rol === "elaboro" ? "Elaboró" : p.rol === "colaboro" ? "Colaboró" : "Aprobó",
            }))}
          />
        </PDFSection>

        <PDFFooter version={version} />
      </PDFPageWrapper>

      {/* Sectores de Incendio */}
      <PDFPageWrapper>
        <PDFSection title="3. Sectores de Incendio">
          {sectores.map((sector, idx) => (
            <View key={sector.id} style={styles.mb12} wrap={false}>
              <Text style={styles.sectionSubtitle}>
                3.{idx + 1}. {sector.nombre} ({sector.superficiem2} m²)
              </Text>
              <PDFInfoGrid
                items={[
                  { label: "Actividad", value: sector.tipoActividad },
                  { label: "Ventilación", value: sector.claseVentilacion },
                  { label: "Piso", value: sector.tipoPiso },
                  { label: "Paredes", value: sector.tipoParedes },
                  { label: "Techo", value: sector.tipoTecho },
                  { label: "Inst. Eléctrica", value: sector.tieneInstalacionElectrica ? "Sí" : "No" },
                  { label: "Accesos", value: sector.accesos },
                  { label: "Descripción", value: sector.descripcionConstructiva, fullWidth: true },
                ]}
              />
              {sector.materiales.length > 0 && (
                <View style={styles.mt8}>
                  <Text style={[styles.textSm, styles.textBold, styles.mb4]}>
                    Materiales Combustibles:
                  </Text>
                  <PDFTable
                    columns={[
                      { key: "nombre", header: "Material", width: "40%" },
                      { key: "pesoKg", header: "Peso (kg)", width: "20%", align: "right" },
                      { key: "poder", header: "Poder Cal. (kcal/kg)", width: "20%", align: "right" },
                      { key: "totalKcal", header: "Total (kcal)", width: "20%", align: "right" },
                    ]}
                    data={sector.materiales.map((m) => ({
                      nombre: m.nombre,
                      pesoKg: m.pesoKg.toFixed(1),
                      poder: m.poderCalorificoKcalKg.toLocaleString("es-AR"),
                      totalKcal: (m.pesoKg * m.poderCalorificoKcalKg).toLocaleString("es-AR"),
                    }))}
                    showRowNumbers
                  />
                </View>
              )}
            </View>
          ))}
        </PDFSection>

        {/* Extintores Existentes */}
        {extintoresExistentes.length > 0 && (
          <PDFSection title="4. Extintores Existentes">
            <PDFTable
              columns={[
                { key: "sector", header: "Sector", width: "30%" },
                { key: "tipo", header: "Tipo", width: "25%" },
                { key: "capacidad", header: "Capacidad (kg)", width: "20%", align: "right" },
                { key: "cantidad", header: "Cantidad", width: "15%", align: "center" },
              ]}
              data={extintoresExistentes.map((e) => {
                const sector = sectores.find((s) => s.id === e.sectorId)
                return {
                  sector: sector?.nombre || "-",
                  tipo: e.tipo,
                  capacidad: e.capacidadKg,
                  cantidad: e.cantidad,
                }
              })}
            />
          </PDFSection>
        )}

        <PDFFooter version={version} />
      </PDFPageWrapper>

      {/* Resultados */}
      {resultados && (
        <PDFPageWrapper>
          {/* Carga de Fuego por Sector */}
          <PDFSection title="5. Resultados - Carga de Fuego por Sector">
            <PDFTable
              columns={[
                { key: "sector", header: "Sector", width: "20%" },
                { key: "totalKcal", header: "Total (kcal)", width: "18%", align: "right" },
                { key: "eqMadera", header: "Eq. Madera (kg)", width: "18%", align: "right" },
                { key: "carga", header: "Carga (kg/m²)", width: "18%", align: "right" },
                { key: "nivel", header: "Nivel", width: "13%", align: "center" },
                { key: "clasif", header: "Clasificación", width: "13%" },
              ]}
              data={resultados.cargaFuego.map((r) => ({
                sector: r.sectorNombre,
                totalKcal: r.totalKcal.toLocaleString("es-AR"),
                eqMadera: r.equivalenteMaderaKg.toFixed(1),
                carga: r.cargaFuegoKgm2.toFixed(2),
                nivel: r.nivelRiesgo,
                clasif: r.clasificacionRiesgo,
              }))}
            />
          </PDFSection>

          {/* Resistencia al Fuego */}
          <PDFSection title="6. Resistencia al Fuego Requerida">
            <PDFTable
              columns={[
                { key: "sector", header: "Sector", width: "40%" },
                { key: "factor", header: "Factor", width: "30%", align: "center" },
                { key: "duracion", header: "Duración (min)", width: "30%", align: "center" },
              ]}
              data={resultados.resistenciaFuego.map((r) => {
                const sector = sectores.find((s) => s.id === r.sectorId)
                return {
                  sector: sector?.nombre || "-",
                  factor: r.factorResistencia,
                  duracion: r.duracionMinutos,
                }
              })}
            />
          </PDFSection>

          {/* Potencial Extintor */}
          <PDFSection title="7. Verificación de Potencial Extintor">
            <PDFTable
              columns={[
                { key: "sector", header: "Sector", width: "15%" },
                { key: "reqA", header: "Req. A", width: "12%" },
                { key: "reqB", header: "Req. B", width: "12%" },
                { key: "comb", header: "Combinado", width: "12%" },
                { key: "requeridos", header: "Requeridos", width: "17%" },
                { key: "existentes", header: "Existentes", width: "17%" },
                { key: "cumple", header: "Cumple", width: "15%", align: "center" },
              ]}
              data={resultados.potencialExtintor.map((r) => {
                const sector = sectores.find((s) => s.id === r.sectorId)
                return {
                  sector: sector?.nombre || "-",
                  reqA: r.potencialRequeridoA,
                  reqB: r.potencialRequeridoB,
                  comb: r.potencialCombinado,
                  requeridos: r.extintoresRequeridos,
                  existentes: r.extintoresExistentes,
                  cumple: r.cumple ? "SÍ" : "NO",
                }
              })}
            />
          </PDFSection>

          {/* Evacuación */}
          <PDFSection title="8. Verificación de Medios de Escape">
            <PDFTable
              columns={[
                { key: "sector", header: "Sector", width: "15%" },
                { key: "fo", header: "F.O. (m²/p)", width: "12%", align: "center" },
                { key: "ocup", header: "Ocup. Máx.", width: "12%", align: "center" },
                { key: "unas", header: "U.A.S.", width: "12%", align: "center" },
                { key: "anchoReq", header: "Ancho Req. (m)", width: "15%", align: "center" },
                { key: "anchoExist", header: "Ancho Exist. (m)", width: "15%", align: "center" },
                { key: "cumple", header: "Cumple", width: "12%", align: "center" },
              ]}
              data={resultados.evacuacion.map((r) => {
                const sector = sectores.find((s) => s.id === r.sectorId)
                return {
                  sector: sector?.nombre || "-",
                  fo: r.factorOcupacion,
                  ocup: r.ocupantesMaximo,
                  unas: r.unidadesAnchoSalida,
                  anchoReq: r.anchoMinimoRequerido.toFixed(2),
                  anchoExist: r.anchoExistente.toFixed(2),
                  cumple: r.cumple ? "SÍ" : "NO",
                }
              })}
            />
          </PDFSection>

          {/* Condiciones de Incendio */}
          {resultados.condiciones && (
            <PDFSection title="9. Condiciones Contra Incendio">
              <View style={styles.mb8}>
                <Text style={styles.sectionSubtitle}>Condiciones de Situación</Text>
                {resultados.condiciones.situacion.map((c, i) => (
                  <Text key={i} style={styles.textSm}>• {c}</Text>
                ))}
              </View>
              <View style={styles.mb8}>
                <Text style={styles.sectionSubtitle}>Condiciones de Construcción</Text>
                {resultados.condiciones.construccion.map((c, i) => (
                  <Text key={i} style={styles.textSm}>• {c}</Text>
                ))}
              </View>
              <View style={styles.mb8}>
                <Text style={styles.sectionSubtitle}>Condiciones de Extinción</Text>
                {resultados.condiciones.extincion.map((c, i) => (
                  <Text key={i} style={styles.textSm}>• {c}</Text>
                ))}
              </View>
            </PDFSection>
          )}

          {/* Firmas */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 32 }}>
            {profesionales.filter((p) => p.rol === "elaboro").map((p, i) => (
              <PDFSignatureLine key={i} name={p.nombre} role={`Elaboró - Mat. ${p.matricula}`} />
            ))}
            {profesionales.filter((p) => p.rol === "aprobo").map((p, i) => (
              <PDFSignatureLine key={i} name={p.nombre} role={`Aprobó - Mat. ${p.matricula}`} />
            ))}
          </View>

          <PDFFooter version={version} />
        </PDFPageWrapper>
      )}
    </PDFDocumentWrapper>
  )
}

// =============================================================================
// CLIENT-SIDE STATE MANAGEMENT using React Context
// =============================================================================

import type { FormState } from "./types"

export const STEPS = [
  { id: 0, label: "Empresa", description: "Datos del establecimiento" },
  { id: 1, label: "Profesionales", description: "Equipo tecnico actuante" },
  { id: 2, label: "Sectores", description: "Sectores de incendio" },
  { id: 3, label: "Materiales", description: "Relevamiento de combustibles" },
  { id: 4, label: "Extintores", description: "Instalaciones contra incendio" },
  { id: 5, label: "Evacuacion", description: "Datos de evacuacion" },
  { id: 6, label: "Resultados", description: "Calculos y resumen" },
  { id: 7, label: "Informe", description: "Vista previa del informe" },
] as const

export const DEFAULT_FORM_STATE: FormState = {
  empresa: {
    nombre: "",
    domicilio: "",
    localidad: "",
    provincia: "Buenos Aires",
    actividad: "",
    superficiePrediom2: 0,
    superficieCubiertam2: 0,
    cantidadPersonal: 0,
    distribucionPersonal: "",
    codigoInforme: "EMPR-ETCF-HYS-01",
    anio: new Date().getFullYear(),
  },
  profesionales: [
    { nombre: "", matricula: "", rol: "elaboro" },
    { nombre: "", matricula: "", rol: "colaboro" },
  ],
  sectores: [],
  extintoresExistentes: [],
  instalacionesContraIncendio: [],
  datosEvacuacion: [],
  resultados: null,
  currentStep: 0,
}

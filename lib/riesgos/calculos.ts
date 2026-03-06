import type { Hazard, RiskClasificacion } from "@/lib/crm-types"

export interface RiskCalculation {
  probabilidad: number
  severidad: number
  nivelRiesgo: number
  clasificacion: RiskClasificacion
}

/**
 * Calcula el nivel de riesgo a partir de los sub-índices de un peligro.
 * Probabilidad = promedio de 4 sub-índices (personas_expuestas, procedimientos, capacitación, exposición)
 * Nivel de riesgo = probabilidad × severidad
 * Clasificación según tabla NR:
 *   ≤20 Tolerable | ≤40 Moderado | ≤70 Importante | >70 Intolerable
 */
export function calcularRiesgo(hazard: Partial<Hazard>): RiskCalculation {
  const probabilidad =
    ((hazard.indice_personas_expuestas || 1) +
      (hazard.indice_procedimientos || 1) +
      (hazard.indice_capacitacion || 1) +
      (hazard.indice_exposicion || 1)) /
    4

  const severidad = hazard.indice_severidad || 1
  const nivelRiesgo = probabilidad * severidad

  let clasificacion: RiskClasificacion
  if (nivelRiesgo <= 20) clasificacion = "Tolerable"
  else if (nivelRiesgo <= 40) clasificacion = "Moderado"
  else if (nivelRiesgo <= 70) clasificacion = "Importante"
  else clasificacion = "Intolerable"

  return { probabilidad, severidad, nivelRiesgo, clasificacion }
}

/**
 * Calcula riesgo teórico (con mejoras propuestas) a partir de los índices teóricos.
 */
export function calcularRiesgoTeorico(hazard: Partial<Hazard>): RiskCalculation {
  return calcularRiesgo({
    indice_personas_expuestas: hazard.indice_personas_expuestas_teorico,
    indice_procedimientos: hazard.indice_procedimientos_teorico,
    indice_capacitacion: hazard.indice_capacitacion_teorico,
    indice_exposicion: hazard.indice_exposicion_teorico,
    indice_severidad: hazard.indice_severidad_teorico,
  })
}

/**
 * Sub-índice descriptions for UI labels (from Genesis model)
 */
export const INDICE_LABELS = {
  personas_expuestas: {
    label: "Personas Expuestas",
    description: "Cantidad de personas expuestas al riesgo",
    scale: [
      { value: 1, label: "1-2 personas" },
      { value: 2, label: "3-5 personas" },
      { value: 3, label: "6-10 personas" },
      { value: 6, label: "11-20 personas" },
      { value: 10, label: "Más de 20 personas" },
    ],
  },
  procedimientos: {
    label: "Procedimientos Existentes",
    description: "Existencia y cumplimiento de procedimientos de trabajo",
    scale: [
      { value: 1, label: "Existen, son satisfactorios y suficientes" },
      { value: 2, label: "Existen parcialmente y no son satisfactorios" },
      { value: 6, label: "Existen pero no se aplican" },
      { value: 10, label: "No existen" },
    ],
  },
  capacitacion: {
    label: "Capacitación",
    description: "Nivel de capacitación y entrenamiento del personal",
    scale: [
      { value: 1, label: "Personal entrenado, conoce el peligro y lo previene" },
      { value: 2, label: "Personal parcialmente entrenado, conoce el peligro" },
      { value: 6, label: "Personal no entrenado, conoce el peligro" },
      { value: 10, label: "Personal no entrenado, no conoce el peligro" },
    ],
  },
  exposicion: {
    label: "Exposición al Riesgo",
    description: "Frecuencia de exposición al riesgo",
    scale: [
      { value: 1, label: "Remotamente posible" },
      { value: 2, label: "Ocasional (alguna vez al año)" },
      { value: 3, label: "Frecuente (alguna vez al mes)" },
      { value: 6, label: "Regular (alguna vez a la semana)" },
      { value: 10, label: "Continua (varias veces al día)" },
    ],
  },
  severidad: {
    label: "Severidad",
    description: "Gravedad del daño más probable",
    scale: [
      { value: 1, label: "Lesiones leves sin baja" },
      { value: 2, label: "Lesiones leves con baja" },
      { value: 3, label: "Lesiones graves con baja" },
      { value: 6, label: "Lesiones muy graves (incapacidad)" },
      { value: 10, label: "Muerte / catástrofe" },
    ],
  },
} as const

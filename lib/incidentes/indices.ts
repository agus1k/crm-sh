export interface IndicesSiniestralidad {
  indiceFrecuencia: number // (accidentes × 1.000.000) / horas trabajadas
  indiceGravedad: number // (días perdidos × 1.000) / horas trabajadas
  indiceIncidencia: number // (accidentes × 1.000) / trabajadores expuestos
  indiceDuracionMedia: number // días perdidos / accidentes
}

/**
 * Calcula los 4 índices de siniestralidad según normativa argentina.
 *
 * - Índice de Frecuencia (IF): accidentes por millón de horas trabajadas
 * - Índice de Gravedad (IG): días perdidos por cada mil horas trabajadas
 * - Índice de Incidencia (II): accidentes por cada mil trabajadores
 * - Índice de Duración Media (DM): días promedio de baja por accidente
 */
export function calcularIndices(
  accidentes: number,
  diasPerdidos: number,
  horasTrabajadas: number,
  trabajadores: number
): IndicesSiniestralidad {
  return {
    indiceFrecuencia:
      horasTrabajadas > 0 ? (accidentes * 1_000_000) / horasTrabajadas : 0,
    indiceGravedad:
      horasTrabajadas > 0 ? (diasPerdidos * 1_000) / horasTrabajadas : 0,
    indiceIncidencia:
      trabajadores > 0 ? (accidentes * 1_000) / trabajadores : 0,
    indiceDuracionMedia: accidentes > 0 ? diasPerdidos / accidentes : 0,
  }
}

/**
 * Labels y descripciones para los 4 índices (para UI cards)
 */
export const INDICE_INFO = {
  indiceFrecuencia: {
    label: "Índice de Frecuencia",
    abbreviation: "IF",
    description: "Accidentes por millón de horas trabajadas",
    formula: "(Accidentes × 1.000.000) / Horas trabajadas",
    unit: "acc/M hs",
  },
  indiceGravedad: {
    label: "Índice de Gravedad",
    abbreviation: "IG",
    description: "Días perdidos por cada mil horas trabajadas",
    formula: "(Días perdidos × 1.000) / Horas trabajadas",
    unit: "días/K hs",
  },
  indiceIncidencia: {
    label: "Índice de Incidencia",
    abbreviation: "II",
    description: "Accidentes por cada mil trabajadores",
    formula: "(Accidentes × 1.000) / Trabajadores",
    unit: "acc/K trab",
  },
  indiceDuracionMedia: {
    label: "Duración Media",
    abbreviation: "DM",
    description: "Días promedio de baja por accidente",
    formula: "Días perdidos / Accidentes",
    unit: "días/acc",
  },
} as const

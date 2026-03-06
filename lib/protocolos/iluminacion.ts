import type { MeasurementPoint, NormativaIluminacion } from "@/lib/crm-types"

/**
 * Illumination compliance engine - Res. 84/12 / Dec. 351/79 Anexo IV
 *
 * Evaluates whether measured lux values meet the minimum required
 * for each visual task according to Argentine regulations.
 */

// --- Compliance evaluation ---

export function evaluateIlluminationPoint(point: {
  ilum_valor_medido_lux: number | null
  ilum_valor_minimo_lux: number | null
}): boolean | null {
  if (
    point.ilum_valor_medido_lux == null ||
    point.ilum_valor_minimo_lux == null
  ) {
    return null
  }
  return point.ilum_valor_medido_lux >= point.ilum_valor_minimo_lux
}

/**
 * Calculate uniformity ratio: E_min / E_med
 * Should be >= 0.5 for general lighting per Dec. 351/79
 */
export function calculateUniformity(
  measuredValues: number[]
): number | null {
  if (measuredValues.length === 0) return null
  const min = Math.min(...measuredValues)
  const avg =
    measuredValues.reduce((sum, v) => sum + v, 0) / measuredValues.length
  if (avg === 0) return null
  return Math.round((min / avg) * 100) / 100
}

// --- Compliance summary ---

export function calculateIlluminationCompliance(
  points: MeasurementPoint[]
): {
  total: number
  cumple: number
  noCumple: number
  sinEvaluar: number
  porcentaje: number
  cumpleGeneral: boolean
} {
  const evaluated = points.filter(
    (p) =>
      p.ilum_valor_medido_lux != null && p.ilum_valor_minimo_lux != null
  )
  const cumple = evaluated.filter(
    (p) => p.ilum_valor_medido_lux! >= p.ilum_valor_minimo_lux!
  ).length
  const noCumple = evaluated.length - cumple
  const sinEvaluar = points.length - evaluated.length
  const porcentaje =
    evaluated.length > 0
      ? Math.round((cumple / evaluated.length) * 100)
      : 0

  return {
    total: points.length,
    cumple,
    noCumple,
    sinEvaluar,
    porcentaje,
    cumpleGeneral: noCumple === 0 && evaluated.length > 0,
  }
}

// --- Normativa lookup helpers ---

/**
 * Find the matching minimum lux value from the normativa table
 * based on task description and building type.
 */
export function findMinimumLux(
  normativa: NormativaIluminacion[],
  tarea: string,
  tipoEdificio?: string
): NormativaIluminacion | undefined {
  const tareaLower = tarea.toLowerCase().trim()

  // Try exact match on tarea + tipo_edificio
  if (tipoEdificio) {
    const tipoLower = tipoEdificio.toLowerCase().trim()
    const exact = normativa.find(
      (n) =>
        n.tarea.toLowerCase() === tareaLower &&
        n.tipo_edificio.toLowerCase() === tipoLower
    )
    if (exact) return exact
  }

  // Try partial match on tarea
  const partial = normativa.find(
    (n) =>
      tareaLower.includes(n.tarea.toLowerCase()) ||
      n.tarea.toLowerCase().includes(tareaLower)
  )
  if (partial) return partial

  return undefined
}

/**
 * Illumination source types for form select
 */
export const ILUMINACION_FUENTES = [
  "LED",
  "Fluorescente",
  "Sodio",
  "Mercurio",
  "Incandescente",
  "Halógena",
  "Natural",
  "Mixta",
] as const

export const ILUMINACION_TIPOS = [
  { value: "natural" as const, label: "Natural" },
  { value: "artificial" as const, label: "Artificial" },
  { value: "mixta" as const, label: "Mixta" },
] as const

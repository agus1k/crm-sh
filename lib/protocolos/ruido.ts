import type { MeasurementPoint, NormativaRuido } from "@/lib/crm-types"

/**
 * Noise compliance engine - Res. 85/12 / Res. 295/03
 *
 * Evaluates noise exposure against Argentine regulatory limits.
 * Uses dose calculation: D = T_exposure / T_permitted
 * Combined dose for multiple exposures: D_total = SUM(C_i / T_i)
 */

// --- Dose calculation ---

/**
 * Calculate noise dose for a single point.
 * D = T_exposure / T_permitted
 * Dose >= 1.0 means non-compliant (exceeds 100%)
 */
export function calculateNoiseDose(
  tiempoExposicionHs: number,
  limiteDba: number,
  valorMedidoDba: number
): number {
  // Calculate permitted time using the equal-energy rule (3 dB exchange rate)
  // T_permitted = 8 / (2^((L_measured - 85) / 3))
  // For Res. 295/03 the base is 85 dBA for 8 hours
  const tiempoPermitido = getPermittedTime(valorMedidoDba)
  if (tiempoPermitido <= 0) return 999 // Extremely high noise

  return Math.round((tiempoExposicionHs / tiempoPermitido) * 10000) / 10000
}

/**
 * Get the permitted exposure time (in hours) for a given noise level.
 * Uses the Res. 295/03 exchange rate (3 dB doubling).
 * Base: 85 dBA = 8 hours
 */
export function getPermittedTime(dba: number): number {
  if (dba < 80) return 24 // Below regulatory concern
  return 8 / Math.pow(2, (dba - 85) / 3)
}

/**
 * Calculate combined dose for multiple exposures (different noise levels).
 * D_total = SUM(C_i / T_i)
 * where C_i = actual exposure time, T_i = permitted time at that level
 */
export function calculateCombinedDose(
  exposures: Array<{ tiempoHs: number; dba: number }>
): number {
  const total = exposures.reduce((sum, exp) => {
    const permitted = getPermittedTime(exp.dba)
    return sum + exp.tiempoHs / permitted
  }, 0)
  return Math.round(total * 10000) / 10000
}

// --- Compliance evaluation ---

export function evaluateNoisePoint(point: {
  ruido_valor_medido_dba: number | null
  ruido_limite_dba: number | null
  ruido_dosis: number | null
}): boolean | null {
  // If dose is available, use dose-based compliance (< 1.0 = compliant)
  if (point.ruido_dosis != null) {
    return point.ruido_dosis < 1.0
  }
  // Fallback to simple level comparison
  if (
    point.ruido_valor_medido_dba == null ||
    point.ruido_limite_dba == null
  ) {
    return null
  }
  return point.ruido_valor_medido_dba <= point.ruido_limite_dba
}

// --- Compliance summary ---

export function calculateNoiseCompliance(
  points: MeasurementPoint[]
): {
  total: number
  cumple: number
  noCumple: number
  sinEvaluar: number
  porcentaje: number
  cumpleGeneral: boolean
  dosisMaxima: number | null
} {
  const evaluated = points.filter(
    (p) =>
      p.ruido_valor_medido_dba != null &&
      (p.ruido_limite_dba != null || p.ruido_dosis != null)
  )

  const cumple = evaluated.filter((p) => {
    if (p.ruido_dosis != null) return p.ruido_dosis < 1.0
    return p.ruido_valor_medido_dba! <= p.ruido_limite_dba!
  }).length

  const noCumple = evaluated.length - cumple
  const sinEvaluar = points.length - evaluated.length
  const porcentaje =
    evaluated.length > 0
      ? Math.round((cumple / evaluated.length) * 100)
      : 0

  // Find max dose
  const dosisValues = points
    .filter((p) => p.ruido_dosis != null)
    .map((p) => p.ruido_dosis!)
  const dosisMaxima = dosisValues.length > 0 ? Math.max(...dosisValues) : null

  return {
    total: points.length,
    cumple,
    noCumple,
    sinEvaluar,
    porcentaje,
    cumpleGeneral: noCumple === 0 && evaluated.length > 0,
    dosisMaxima,
  }
}

// --- Normativa lookup ---

/**
 * Find the noise limit from normativa table based on exposure duration.
 */
export function findNoiseLimit(
  normativa: NormativaRuido[],
  duracionHs: number
): NormativaRuido | undefined {
  // Find the closest matching duration
  let closest: NormativaRuido | undefined
  let minDiff = Infinity

  for (const n of normativa) {
    const diff = Math.abs(n.duracion_hs - duracionHs)
    if (diff < minDiff) {
      minDiff = diff
      closest = n
    }
  }

  return closest
}

// --- Form constants ---

export const RUIDO_TIPOS = [
  { value: "continuo" as const, label: "Continuo" },
  { value: "intermitente" as const, label: "Intermitente" },
  { value: "impulso" as const, label: "Impulso" },
] as const

export const RUIDO_MEDICION_TIPOS = [
  { value: "puntual" as const, label: "Puntual" },
  { value: "dosimetria" as const, label: "Dosimetría" },
] as const

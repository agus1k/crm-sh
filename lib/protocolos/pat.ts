import type { MeasurementPoint } from "@/lib/crm-types"

/**
 * Grounding (Puesta a Tierra) compliance engine - AEA 90364
 *
 * Evaluates whether grounding resistance measurements meet
 * the maximum allowed values per Argentine electrical standards.
 */

// --- Default maximum values ---

/**
 * Standard maximum grounding resistance per AEA 90364.
 * Default: 10 ohm for most installations.
 * Some special installations may require lower values.
 */
export const PAT_VALOR_MAXIMO_DEFAULT = 10 // ohm

export const PAT_VALORES_MAXIMOS = [
  { value: 10, label: "10 ohm - Instalaciones generales" },
  { value: 5, label: "5 ohm - Instalaciones con protección diferencial" },
  { value: 2, label: "2 ohm - Instalaciones especiales" },
  { value: 1, label: "1 ohm - Centros de cómputos / Hospitales" },
] as const

// --- Compliance evaluation ---

export function evaluateGroundingPoint(point: {
  pat_valor_medido_ohm: number | null
  pat_valor_maximo_ohm: number | null
}): boolean | null {
  if (
    point.pat_valor_medido_ohm == null ||
    point.pat_valor_maximo_ohm == null
  ) {
    return null
  }
  return point.pat_valor_medido_ohm <= point.pat_valor_maximo_ohm
}

// --- Compliance summary ---

export function calculateGroundingCompliance(
  points: MeasurementPoint[]
): {
  total: number
  cumple: number
  noCumple: number
  sinEvaluar: number
  porcentaje: number
  cumpleGeneral: boolean
  valorMaximoMedido: number | null
} {
  const evaluated = points.filter(
    (p) =>
      p.pat_valor_medido_ohm != null && p.pat_valor_maximo_ohm != null
  )
  const cumple = evaluated.filter(
    (p) => p.pat_valor_medido_ohm! <= p.pat_valor_maximo_ohm!
  ).length
  const noCumple = evaluated.length - cumple
  const sinEvaluar = points.length - evaluated.length
  const porcentaje =
    evaluated.length > 0
      ? Math.round((cumple / evaluated.length) * 100)
      : 0

  // Find maximum measured value
  const medidos = points
    .filter((p) => p.pat_valor_medido_ohm != null)
    .map((p) => p.pat_valor_medido_ohm!)
  const valorMaximoMedido =
    medidos.length > 0 ? Math.max(...medidos) : null

  return {
    total: points.length,
    cumple,
    noCumple,
    sinEvaluar,
    porcentaje,
    cumpleGeneral: noCumple === 0 && evaluated.length > 0,
    valorMaximoMedido,
  }
}

// --- Form constants ---

export const PAT_ELECTRODOS = [
  "Jabalina de cobre",
  "Jabalina de acero cobreado",
  "Malla de tierra",
  "Placa de cobre",
  "Anillo perimetral",
  "Electrodo de grafito",
] as const

export const PAT_TERRENOS = [
  "Arcilloso húmedo",
  "Arcilloso seco",
  "Arenoso húmedo",
  "Arenoso seco",
  "Calcáreo",
  "Rocoso",
  "Relleno",
  "Tierra vegetal",
] as const

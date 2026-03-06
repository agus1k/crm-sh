// =============================================================================
// MOTOR DE CALCULO - Estudio de Carga de Fuego
// Decreto 351/79 - Ley 19.587
// Todas las formulas son deterministicas, basadas en la normativa vigente
// =============================================================================

import type {
  Sector,
  ExtintorExistente,
  DatosEvacuacion,
  ResultadosCargaFuego,
  ResultadoResistenciaFuego,
  ResultadoPotencialExtintor,
  ResultadoEvacuacion,
  CondicionesIncendio,
  ResultadoCompleto,
  TipoActividad,
} from "./types"

import {
  PODER_CALORIFICO_MADERA,
  TABLA_RIESGO,
  TABLA_RESISTENCIA_FUEGO,
  TABLA_POTENCIAL_EXTINTOR_A,
  TABLA_POTENCIAL_EXTINTOR_B,
  FACTOR_OCUPACION,
  TABLA_ANCHO_SALIDA,
  CONDICIONES_POR_ACTIVIDAD,
  SUPERFICIE_POR_MATAFUEGO,
} from "./normativa"

// =============================================================================
// 1. CARGA DE FUEGO (QF)
// Formula: QF = Equivalente Madera (kg) / Superficie del sector (m2)
// Equivalente Madera = Total Kcal / 4400 kcal/kg
// Total Kcal = SUM(Peso_i * PoderCalorifico_i)
// =============================================================================

export function calcularCargaFuego(sector: Sector): ResultadosCargaFuego {
  const totalKcal = sector.materiales.reduce((sum, mat) => {
    return sum + mat.pesoKg * mat.poderCalorificoKcalKg
  }, 0)

  const equivalenteMaderaKg = totalKcal / PODER_CALORIFICO_MADERA
  const cargaFuegoKgm2 = sector.superficiem2 > 0
    ? equivalenteMaderaKg / sector.superficiem2
    : 0

  const riesgo = clasificarRiesgo(cargaFuegoKgm2)

  return {
    sectorId: sector.id,
    sectorNombre: sector.nombre,
    totalKcal,
    equivalenteMaderaKg: Math.round(equivalenteMaderaKg),
    cargaFuegoKgm2: Math.round(cargaFuegoKgm2 * 100) / 100,
    nivelRiesgo: riesgo.nivel,
    clasificacionRiesgo: riesgo.clasificacion,
  }
}

function clasificarRiesgo(cargaFuegoKgm2: number): { nivel: number; clasificacion: string } {
  for (const rango of TABLA_RIESGO) {
    if (cargaFuegoKgm2 >= rango.min && cargaFuegoKgm2 <= rango.max) {
      return { nivel: rango.nivel, clasificacion: rango.clasificacion }
    }
  }
  return { nivel: 5, clasificacion: "Poco Combustible" }
}

// =============================================================================
// 2. FACTOR DE RESISTENCIA AL FUEGO (FR)
// Basado en tabla normativa: nivel de riesgo + tipo de ventilacion
// =============================================================================

export function calcularResistenciaFuego(
  sector: Sector,
  resultadoCarga: ResultadosCargaFuego
): ResultadoResistenciaFuego {
  const entrada = TABLA_RESISTENCIA_FUEGO.find(
    (r) => r.nivelRiesgo === resultadoCarga.nivelRiesgo
  )

  if (!entrada) {
    return {
      sectorId: sector.id,
      factorResistencia: "F60",
      duracionMinutos: 60,
    }
  }

  const fr =
    sector.claseVentilacion === "natural"
      ? entrada.ventilacionNatural
      : entrada.ventilacionMecanica

  return {
    sectorId: sector.id,
    factorResistencia: fr,
    duracionMinutos: entrada.minutos,
  }
}

// =============================================================================
// 3. POTENCIAL EXTINTOR
// Basado en carga de fuego + nivel de riesgo
// Incluye Clase A y Clase B
// =============================================================================

export function calcularPotencialExtintor(
  sector: Sector,
  resultadoCarga: ResultadosCargaFuego,
  extintoresExistentes: ExtintorExistente[]
): ResultadoPotencialExtintor {
  const carga = resultadoCarga.cargaFuegoKgm2
  const riesgo = resultadoCarga.nivelRiesgo

  // Potencial Clase A
  let potencialA = "1A"
  for (const fila of TABLA_POTENCIAL_EXTINTOR_A) {
    if (carga <= fila.cargaFuegoHasta) {
      if (riesgo <= 2) potencialA = fila.riesgo1y2
      else if (riesgo <= 4) potencialA = fila.riesgo3y4
      else potencialA = fila.riesgo5
      break
    }
  }

  // Potencial Clase B
  let potencialB = "---"
  for (const fila of TABLA_POTENCIAL_EXTINTOR_B) {
    if (carga <= fila.cargaFuegoHasta) {
      if (riesgo <= 2) potencialB = fila.riesgo1y2
      else if (riesgo <= 4) potencialB = fila.riesgo3y4
      else potencialB = fila.riesgo5
      break
    }
  }

  const combinado = `${potencialA} ${potencialB !== "---" ? potencialB : ""}`.trim()

  // Calcular extintores requeridos (1 cada 200 m2)
  const cantidadRequerida = Math.max(1, Math.ceil(sector.superficiem2 / SUPERFICIE_POR_MATAFUEGO))

  const extintoresSector = extintoresExistentes.filter(
    (e) => e.sectorId === sector.id
  )
  const cantidadExistente = extintoresSector.reduce((s, e) => s + e.cantidad, 0)
  const descripcionExistente = extintoresSector.length > 0
    ? extintoresSector
        .map((e) => `${e.cantidad} Extintor(es) ${e.tipo} ${e.capacidadKg} Kg`)
        .join(", ")
    : "NO EXISTE"

  const descripcionRequerida = `${cantidadRequerida} Extintor(es) tipo "ABC" con potencial ${combinado}`

  return {
    sectorId: sector.id,
    potencialRequeridoA: potencialA,
    potencialRequeridoB: potencialB,
    potencialCombinado: combinado,
    extintoresRequeridos: descripcionRequerida,
    extintoresExistentes: descripcionExistente,
    cumple: cantidadExistente >= cantidadRequerida,
  }
}

// =============================================================================
// 4. EVACUACION
// Factor de Ocupacion: FO = SP / X (donde X es m2/persona segun actividad)
// Unidades de Ancho de Salida: n = N / 100 (minimo 2)
// =============================================================================

export function calcularEvacuacion(
  sector: Sector,
  datosEvacuacion: DatosEvacuacion
): ResultadoEvacuacion {
  const x = datosEvacuacion.factorOcupacionm2PorPersona || 
    FACTOR_OCUPACION[sector.tipoActividad] || 30

  const ocupantesMaximo = Math.ceil(sector.superficiem2 / x)
  const nCalc = ocupantesMaximo / 100
  const unidadesAnchoSalida = Math.max(2, Math.ceil(nCalc))

  // Buscar ancho minimo requerido
  const filaAncho = TABLA_ANCHO_SALIDA.find(
    (a) => a.unidades === unidadesAnchoSalida
  ) || TABLA_ANCHO_SALIDA[0]

  const anchoMinimo =
    datosEvacuacion.tipoEdificio === "nuevo"
      ? filaAncho.edificioNuevo
      : filaAncho.edificioExistente

  return {
    sectorId: sector.id,
    factorOcupacion: x,
    ocupantesMaximo,
    unidadesAnchoSalida,
    anchoMinimoRequerido: anchoMinimo,
    anchoExistente: datosEvacuacion.anchoSalidaExistentem,
    cumple: datosEvacuacion.anchoSalidaExistentem >= anchoMinimo,
  }
}

// =============================================================================
// 5. CONDICIONES S / C / E
// Basado en tipo de actividad segun tabla normativa
// =============================================================================

export function determinarCondiciones(
  tipoActividad: TipoActividad
): CondicionesIncendio {
  const cond = CONDICIONES_POR_ACTIVIDAD[tipoActividad]
  if (!cond) {
    return { situacion: [], construccion: ["C1"], extincion: ["E8"] }
  }
  return {
    situacion: cond.situacion,
    construccion: cond.construccion,
    extincion: cond.extincion,
  }
}

// =============================================================================
// 6. CALCULO COMPLETO
// Ejecuta todos los calculos para todos los sectores
// =============================================================================

export function calcularTodo(
  sectores: Sector[],
  extintoresExistentes: ExtintorExistente[],
  datosEvacuacion: DatosEvacuacion[]
): ResultadoCompleto {
  const resultadosCarga = sectores.map((s) => calcularCargaFuego(s))
  const resultadosFR = sectores.map((s, i) =>
    calcularResistenciaFuego(s, resultadosCarga[i])
  )
  const resultadosPE = sectores.map((s, i) =>
    calcularPotencialExtintor(s, resultadosCarga[i], extintoresExistentes)
  )
  const resultadosEvac = sectores.map((s) => {
    const datos = datosEvacuacion.find((d) => d.sectorId === s.id)
    if (datos) return calcularEvacuacion(s, datos)
    return calcularEvacuacion(s, {
      sectorId: s.id,
      factorOcupacionm2PorPersona: FACTOR_OCUPACION[s.tipoActividad] || 30,
      tipoEdificio: "existente",
      anchoSalidaExistentem: 0,
    })
  })

  // Combine conditions from all sectors
  const allConditions: CondicionesIncendio = {
    situacion: [],
    construccion: [],
    extincion: [],
  }
  for (const sector of sectores) {
    const cond = determinarCondiciones(sector.tipoActividad)
    for (const s of cond.situacion) {
      if (!allConditions.situacion.includes(s)) allConditions.situacion.push(s)
    }
    for (const c of cond.construccion) {
      if (!allConditions.construccion.includes(c)) allConditions.construccion.push(c)
    }
    for (const e of cond.extincion) {
      if (!allConditions.extincion.includes(e)) allConditions.extincion.push(e)
    }
  }

  return {
    cargaFuego: resultadosCarga,
    resistenciaFuego: resultadosFR,
    potencialExtintor: resultadosPE,
    evacuacion: resultadosEvac,
    condiciones: allConditions,
  }
}

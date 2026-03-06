// =============================================================================
// TYPES: Estudio de Carga de Fuego - Decreto 351/79
// =============================================================================

export interface DatosEmpresa {
  nombre: string
  domicilio: string
  localidad: string
  provincia: string
  actividad: string
  superficiePrediom2: number
  superficieCubiertam2: number
  cantidadPersonal: number
  distribucionPersonal: string
  codigoInforme: string
  anio: number
}

export interface Profesional {
  nombre: string
  matricula: string
  rol: "elaboro" | "colaboro" | "aprobo"
}

export interface MaterialCombustible {
  id: string
  nombre: string
  pesoKg: number
  poderCalorificoKcalKg: number
}

export type TipoActividad =
  | "residencial"
  | "oficinas"
  | "comercial_1"
  | "comercial_2"
  | "industrial_1"
  | "industrial_2"
  | "deposito_1"
  | "deposito_2"
  | "espectaculos"
  | "educacion"

export type ClaseVentilacion = "natural" | "mecanica"

export type TipoEdificio = "nuevo" | "existente"

export interface Sector {
  id: string
  nombre: string
  superficiem2: number
  tipoActividad: TipoActividad
  claseVentilacion: ClaseVentilacion
  materiales: MaterialCombustible[]
  descripcionConstructiva: string
  tipoPiso: string
  tipoParedes: string
  tipoTecho: string
  tieneInstalacionElectrica: boolean
  accesos: string
}

export interface ExtintorExistente {
  id: string
  sectorId: string
  tipo: string
  capacidadKg: number
  cantidad: number
}

export interface InstalacionContraIncendio {
  tipo: string
  ubicacion: string
  cantidad: number
  descripcion: string
}

export interface DatosEvacuacion {
  sectorId: string
  factorOcupacionm2PorPersona: number
  tipoEdificio: TipoEdificio
  anchoSalidaExistentem: number
}

// =============================================================================
// RESULTS
// =============================================================================

export interface ResultadosCargaFuego {
  sectorId: string
  sectorNombre: string
  totalKcal: number
  equivalenteMaderaKg: number
  cargaFuegoKgm2: number
  nivelRiesgo: number
  clasificacionRiesgo: string
}

export interface ResultadoResistenciaFuego {
  sectorId: string
  factorResistencia: string // e.g. "F60", "F90", etc.
  duracionMinutos: number
}

export interface ResultadoPotencialExtintor {
  sectorId: string
  potencialRequeridoA: string
  potencialRequeridoB: string
  potencialCombinado: string
  extintoresRequeridos: string
  extintoresExistentes: string
  cumple: boolean
}

export interface ResultadoEvacuacion {
  sectorId: string
  factorOcupacion: number
  ocupantesMaximo: number
  unidadesAnchoSalida: number
  anchoMinimoRequerido: number
  anchoExistente: number
  cumple: boolean
}

export interface CondicionesIncendio {
  situacion: string[]
  construccion: string[]
  extincion: string[]
}

export interface ResultadoCompleto {
  cargaFuego: ResultadosCargaFuego[]
  resistenciaFuego: ResultadoResistenciaFuego[]
  potencialExtintor: ResultadoPotencialExtintor[]
  evacuacion: ResultadoEvacuacion[]
  condiciones: CondicionesIncendio
}

// =============================================================================
// FORM STATE
// =============================================================================

export interface FormState {
  empresa: DatosEmpresa
  profesionales: Profesional[]
  sectores: Sector[]
  extintoresExistentes: ExtintorExistente[]
  instalacionesContraIncendio: InstalacionContraIncendio[]
  datosEvacuacion: DatosEvacuacion[]
  resultados: ResultadoCompleto | null
  currentStep: number
}

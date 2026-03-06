// =============================================================================
// TABLAS NORMATIVAS - Decreto 351/79, Anexo VII, Capitulo 18
// Ley 19.587 - Higiene y Seguridad en el Trabajo
// =============================================================================

// Poder calorifico standard de la madera (kcal/kg)
export const PODER_CALORIFICO_MADERA = 4400

// Tabla de poderes calorificos de materiales combustibles comunes (kcal/kg)
export const MATERIALES_COMUNES: Record<string, number> = {
  "Madera": 4400,
  "Papel / Carton": 4000,
  "Plastico (PE/PP)": 11000,
  "Plastico (PVC)": 5000,
  "Poliuretano expandido": 6500,
  "Goma / Caucho": 10000,
  "Algodon / Textiles": 4000,
  "Aceites minerales": 10000,
  "Aceites vegetales": 9500,
  "Gasoil": 10000,
  "Nafta": 11000,
  "Cera de abejas": 7800,
  "Miel (envase plastico)": 11000,
  "Polietileno": 11000,
  "Poliester": 5500,
  "Pinturas": 5000,
  "Solventes": 8000,
  "Grasa animal": 9500,
  "Fibra de vidrio": 0,
  "Vidrio": 0,
  "Metal": 0,
  "Hormigon": 0,
}

// Tabla de clasificacion de riesgo segun carga de fuego (kg/m2)
// Decreto 351/79, Anexo VII
export interface RangoRiesgo {
  min: number
  max: number
  nivel: number
  clasificacion: string
}

export const TABLA_RIESGO: RangoRiesgo[] = [
  { min: 0, max: 15, nivel: 1, clasificacion: "Explosivo" },
  { min: 15.01, max: 30, nivel: 2, clasificacion: "Inflamable" },
  { min: 30.01, max: 60, nivel: 3, clasificacion: "Muy Combustible" },
  { min: 60.01, max: 100, nivel: 4, clasificacion: "Combustible" },
  { min: 100.01, max: 200, nivel: 5, clasificacion: "Poco Combustible" },
  { min: 200.01, max: 99999, nivel: 6, clasificacion: "Incombustible" },
  { min: 0, max: 0, nivel: 7, clasificacion: "Refractario" },
]

// Tabla de Resistencia al Fuego (FR) segun riesgo y ventilacion
// Valores en formato "F30", "F60", "F90", etc.
export interface FactorResistencia {
  nivelRiesgo: number
  ventilacionNatural: string
  ventilacionMecanica: string
  minutos: number
}

export const TABLA_RESISTENCIA_FUEGO: FactorResistencia[] = [
  { nivelRiesgo: 1, ventilacionNatural: "F60", ventilacionMecanica: "F60", minutos: 60 },
  { nivelRiesgo: 2, ventilacionNatural: "F60", ventilacionMecanica: "F60", minutos: 60 },
  { nivelRiesgo: 3, ventilacionNatural: "F30", ventilacionMecanica: "F60", minutos: 30 },
  { nivelRiesgo: 4, ventilacionNatural: "F30", ventilacionMecanica: "F30", minutos: 30 },
  { nivelRiesgo: 5, ventilacionNatural: "NR", ventilacionMecanica: "F30", minutos: 0 },
  { nivelRiesgo: 6, ventilacionNatural: "NR", ventilacionMecanica: "NR", minutos: 0 },
  { nivelRiesgo: 7, ventilacionNatural: "NR", ventilacionMecanica: "NR", minutos: 0 },
]

// Tabla de Potencial Extintor requerido - Fuego Clase A
export interface PotencialExtintorA {
  cargaFuegoHasta: number
  riesgo1y2: string
  riesgo3y4: string
  riesgo5: string
}

export const TABLA_POTENCIAL_EXTINTOR_A: PotencialExtintorA[] = [
  { cargaFuegoHasta: 15, riesgo1y2: "---", riesgo3y4: "1A", riesgo5: "1A" },
  { cargaFuegoHasta: 30, riesgo1y2: "---", riesgo3y4: "2A", riesgo5: "1A" },
  { cargaFuegoHasta: 60, riesgo1y2: "---", riesgo3y4: "3A", riesgo5: "2A" },
  { cargaFuegoHasta: 100, riesgo1y2: "---", riesgo3y4: "6A", riesgo5: "4A" },
  { cargaFuegoHasta: 200, riesgo1y2: "---", riesgo3y4: "8A", riesgo5: "6A" },
  { cargaFuegoHasta: 99999, riesgo1y2: "A determinar", riesgo3y4: "10A", riesgo5: "8A" },
]

// Tabla de Potencial Extintor requerido - Fuego Clase B
export interface PotencialExtintorB {
  cargaFuegoHasta: number
  riesgo1y2: string
  riesgo3y4: string
  riesgo5: string
}

export const TABLA_POTENCIAL_EXTINTOR_B: PotencialExtintorB[] = [
  { cargaFuegoHasta: 15, riesgo1y2: "6B", riesgo3y4: "4B", riesgo5: "---" },
  { cargaFuegoHasta: 30, riesgo1y2: "8B", riesgo3y4: "6B", riesgo5: "---" },
  { cargaFuegoHasta: 60, riesgo1y2: "10B", riesgo3y4: "8B", riesgo5: "---" },
  { cargaFuegoHasta: 100, riesgo1y2: "20B", riesgo3y4: "10B", riesgo5: "---" },
  { cargaFuegoHasta: 200, riesgo1y2: "40B", riesgo3y4: "20B", riesgo5: "---" },
  { cargaFuegoHasta: 99999, riesgo1y2: "80B", riesgo3y4: "40B", riesgo5: "---" },
]

// Tabla de Factor de Ocupacion segun tipo de actividad (m2 por persona)
export const FACTOR_OCUPACION: Record<string, number> = {
  "residencial": 12,
  "oficinas": 8,
  "comercial_1": 3,
  "comercial_2": 5,
  "industrial_1": 16,
  "industrial_2": 16,
  "deposito_1": 30,
  "deposito_2": 30,
  "espectaculos": 1,
  "educacion": 2,
}

// Tabla de ancho minimo de salida segun unidades de ancho de salida
export interface AnchoSalida {
  unidades: number
  edificioNuevo: number
  edificioExistente: number
}

export const TABLA_ANCHO_SALIDA: AnchoSalida[] = [
  { unidades: 2, edificioNuevo: 1.10, edificioExistente: 0.96 },
  { unidades: 3, edificioNuevo: 1.55, edificioExistente: 1.45 },
  { unidades: 4, edificioNuevo: 2.00, edificioExistente: 1.85 },
  { unidades: 5, edificioNuevo: 2.45, edificioExistente: 2.30 },
  { unidades: 6, edificioNuevo: 2.90, edificioExistente: 2.80 },
]

// Condiciones de Situacion, Construccion y Extincion segun actividad/riesgo
export const ACTIVIDAD_LABELS: Record<string, string> = {
  "residencial": "Residencial",
  "oficinas": "Oficinas / Actividades Administrativas",
  "comercial_1": "Comercio Minorista",
  "comercial_2": "Comercio Mayorista",
  "industrial_1": "Industria Liviana",
  "industrial_2": "Industria Pesada",
  "deposito_1": "Deposito / Almacenamiento",
  "deposito_2": "Deposito de Alta Densidad",
  "espectaculos": "Espectaculos / Reuniones Publicas",
  "educacion": "Educacion / Institucional",
}

// Condiciones tipicas por tipo de actividad (simplificado para MVP)
export const CONDICIONES_POR_ACTIVIDAD: Record<string, { situacion: string[], construccion: string[], extincion: string[] }> = {
  "residencial": {
    situacion: [],
    construccion: ["C1"],
    extincion: ["E8"],
  },
  "oficinas": {
    situacion: ["S2"],
    construccion: ["C1"],
    extincion: ["E8", "E11", "E13"],
  },
  "comercial_1": {
    situacion: ["S2"],
    construccion: ["C1", "C2"],
    extincion: ["E1", "E3", "E8"],
  },
  "comercial_2": {
    situacion: ["S2"],
    construccion: ["C1", "C2"],
    extincion: ["E1", "E3", "E8"],
  },
  "industrial_1": {
    situacion: ["S2"],
    construccion: ["C1"],
    extincion: ["E8", "E11", "E13"],
  },
  "industrial_2": {
    situacion: ["S1", "S2"],
    construccion: ["C1", "C2", "C3"],
    extincion: ["E1", "E3", "E8", "E11", "E13"],
  },
  "deposito_1": {
    situacion: ["S2"],
    construccion: ["C1"],
    extincion: ["E8", "E11", "E13"],
  },
  "deposito_2": {
    situacion: ["S1", "S2"],
    construccion: ["C1", "C3"],
    extincion: ["E1", "E8", "E11", "E13"],
  },
  "espectaculos": {
    situacion: ["S2"],
    construccion: ["C1", "C2", "C6"],
    extincion: ["E1", "E3", "E8"],
  },
  "educacion": {
    situacion: ["S2"],
    construccion: ["C1"],
    extincion: ["E8", "E11"],
  },
}

// Descripcion de condiciones normativas
export const DESCRIPCION_CONDICIONES: Record<string, string> = {
  "S1": "S1: El edificio se situa aislado de los predios colindantes y de las vias de transito, una distancia mayor a la suma de sus alturas.",
  "S2": "S2: Cualquiera sea la ubicacion del edificio, estando en zona urbana o densamente poblada, el predio debera cercarse preferentemente (salvo las aberturas exteriores de comunicacion) con un muro de 3 metros de altura minima y 0,30 metros de espesor de albanieria de ladrillos macizos o 0,08 metros de hormigon.",
  "C1": "C1: Las cajas de ascensores y montacargas estaran limitadas por muros de resistencia al fuego, del mismo rango que el exigido para los muros, y seran de doble contacto y estaran previstos de cierre automatico.",
  "C2": "C2: Las ventanas y las puertas de acceso a los medios de escape en edificios, que den a un pulmón de manzana, deberán mantener una distancia de 3 metros de todo otro edificio.",
  "C3": "C3: Los sectores de incendio deberan tener una superficie de piso no mayor a los indicados en la tabla correspondiente.",
  "C6": "C6: Se colocara un grupo electrogeno de arranque automatico, con capacidad adecuada para mantener los servicios contra incendio y de alumbrado de los medios de escape.",
  "E1": "E1: El edificio contara con servicio de agua contra incendio segun las normas del capitulo correspondiente.",
  "E3": "E3: Cada sector de incendio con superficie mayor de 600 m2, debera cumplir la Condicion E1. La superficie se reduce a 300 m2 en subsuelos.",
  "E8": "E8: Si el local tiene mas de 1.500 m2 de superficie de piso cumplira con la condicion E1. En subsuelos la superficie se reduce a 800 m2. Habra una boca de impulsion.",
  "E11": "E11: Cuando el edificio conste de piso bajo y mas de 2 pisos altos y ademas tenga superficie de piso que sumada exceda los 900 m2 contara con avisadores automaticos y/o detectores de incendio.",
  "E13": "E13: En los locales que requieran esta Condicion, con superficies mayores de 100 m2, la estiba distara 1m de ejes divisorios. Cuando la superficie exceda de 250 m2, habra camino de ronda a lo largo de todos los muros y entre estibas. Ninguna estiba ocupara mas de 200 m2 de solado.",
}

// Matafuegos minimos: 1 cada 200 m2 (Decreto 351/79 Anexo VII 7.1.1)
export const SUPERFICIE_POR_MATAFUEGO = 200

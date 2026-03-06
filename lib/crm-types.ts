export interface Organization {
  id: string
  name: string
  cuit: string | null
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string
  role: "admin" | "tecnico" | "cliente"
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  matricula: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id: string
  razon_social: string
  cuit: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_telefono: string | null
  responsable: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  client_id: string
  name: string
  description: string | null
  status: "activo" | "completado" | "archivado"
  created_at: string
  updated_at: string
  created_by: string
}

export type ReportType =
  | "carga_de_fuego"
  | "ruido"
  | "iluminacion"
  | "ergonomia"
  | "riesgo_electrico"
  | "otros"

export interface Report {
  id: string
  organization_id: string
  project_id: string
  client_id: string | null
  establishment_id: string | null
  report_type: ReportType
  title: string
  status: "borrador" | "en_revision" | "completado" | "enviado" | "vencido"
  form_data: Record<string, any>
  result_data: Record<string, any> | null
  pdf_url: string | null
  version: number
  expires_at: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export type EventType = "inspeccion" | "vencimiento" | "reunion" | "otro"

export interface CalendarEvent {
  id: string
  organization_id: string
  client_id: string | null
  project_id: string | null
  establishment_id: string | null
  title: string
  description: string | null
  event_date: string
  event_type: EventType
  is_completed: boolean
  created_at: string
  created_by: string
}

// UI Helpers
export const REPORT_TYPES: Record<ReportType, { label: string; color: string }> = {
  carga_de_fuego: { label: "Carga de Fuego", color: "text-orange-500" },
  ruido: { label: "Estudio de Ruido", color: "text-blue-500" },
  iluminacion: { label: "Iluminación", color: "text-yellow-500" },
  ergonomia: { label: "Ergonomía", color: "text-purple-500" },
  riesgo_electrico: { label: "Riesgo Eléctrico", color: "text-red-500" },
  otros: { label: "Otro", color: "text-gray-500" },
}

export const REPORT_STATUSES = {
  borrador: { label: "Borrador", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  en_revision: { label: "En Revisión", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  completado: { label: "Completado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  enviado: { label: "Enviado a Cliente", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  vencido: { label: "Vencido", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export const EVENT_TYPES: Record<EventType, { label: string; color: string }> = {
  inspeccion: { label: "Inspección", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  vencimiento: { label: "Vencimiento", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  reunion: { label: "Reunión", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

// ============================================================
// Phase 1: Foundation Entities
// ============================================================

// --- Professional Credentials (multi-matricula) ---

export type CredentialType =
  | "matricula_provincial"
  | "matricula_nacional"
  | "registro_ambiental"
  | "otro"

export interface ProfessionalCredential {
  id: string
  profile_id: string
  organization_id: string
  tipo: CredentialType
  numero: string
  jurisdiccion: string | null
  entidad_emisora: string | null
  fecha_emision: string | null
  fecha_vencimiento: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export const CREDENTIAL_TYPES: Record<CredentialType, { label: string }> = {
  matricula_provincial: { label: "Matrícula Provincial" },
  matricula_nacional: { label: "Matrícula Nacional" },
  registro_ambiental: { label: "Registro Ambiental" },
  otro: { label: "Otro" },
}

// --- Instruments & Calibrations ---

export type InstrumentType =
  | "luxometro"
  | "decibelimetro"
  | "telurimetro"
  | "termometro"
  | "anemometro"
  | "otro"

export interface Instrument {
  id: string
  organization_id: string
  owner_id: string
  nombre: string
  tipo: InstrumentType
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  latest_calibration?: InstrumentCalibration
}

export interface InstrumentCalibration {
  id: string
  instrument_id: string
  organization_id: string
  laboratorio: string
  numero_certificado: string
  fecha_calibracion: string
  fecha_vencimiento: string
  certificado_url: string | null
  notas: string | null
  created_at: string
}

export const INSTRUMENT_TYPES: Record<InstrumentType, { label: string }> = {
  luxometro: { label: "Luxómetro" },
  decibelimetro: { label: "Decibelímetro" },
  telurimetro: { label: "Telurímetro" },
  termometro: { label: "Termómetro" },
  anemometro: { label: "Anemómetro" },
  otro: { label: "Otro" },
}

// --- Client Hierarchy ---

export interface Establishment {
  id: string
  organization_id: string
  client_id: string
  nombre: string
  direccion: string | null
  localidad: string | null
  provincia: string | null
  codigo_postal: string | null
  telefono: string | null
  email: string | null
  contacto_nombre: string | null
  actividad_principal: string | null
  ciiu: string | null
  superficie_total_m2: number | null
  cantidad_personal: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  sectors?: DBSector[]
  _count?: { sectors: number }
}

// Named DBSector to avoid collision with fire-load Sector type in lib/types.ts
export interface DBSector {
  id: string
  organization_id: string
  establishment_id: string
  nombre: string
  descripcion: string | null
  superficie_m2: number | null
  tipo_actividad: string | null
  clase_ventilacion: "natural" | "mecanica" | null
  cantidad_personal: number
  nivel: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  work_positions?: WorkPosition[]
  _count?: { work_positions: number }
}

export type Turno = "manana" | "tarde" | "noche" | "rotativo"

export interface WorkPosition {
  id: string
  organization_id: string
  sector_id: string
  nombre: string
  descripcion: string | null
  cantidad_trabajadores: number
  turno: Turno | null
  horario_desde: string | null
  horario_hasta: string | null
  tareas_principales: string | null
  created_at: string
  updated_at: string
}

export const TURNOS: Record<Turno, { label: string }> = {
  manana: { label: "Mañana" },
  tarde: { label: "Tarde" },
  noche: { label: "Noche" },
  rotativo: { label: "Rotativo" },
}

export const VENTILACION_TYPES: Record<string, { label: string }> = {
  natural: { label: "Natural" },
  mecanica: { label: "Mecánica" },
}

export const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const

// ============================================================
// Phase 2: Core Operational Entities
// ============================================================

// --- Annual Plans ---

export type PlanStatus = "borrador" | "activo" | "completado" | "archivado"

export type PlanTaskType =
  | "visita"
  | "medicion_iluminacion"
  | "medicion_ruido"
  | "medicion_pat"
  | "carga_de_fuego"
  | "relevamiento_riesgos"
  | "checklist"
  | "capacitacion"
  | "simulacro"
  | "auditoria"
  | "otro"

export type PlanTaskStatus = "planificado" | "en_proceso" | "realizado" | "pendiente" | "cancelado"

export interface AnnualPlan {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string | null
  anio: number
  titulo: string
  descripcion: string | null
  status: PlanStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  establishment?: Establishment
  tasks?: PlanTask[]
  _count?: { tasks: number }
}

export interface PlanTask {
  id: string
  plan_id: string
  organization_id: string
  mes: number
  titulo: string
  descripcion: string | null
  tipo: PlanTaskType
  status: PlanTaskStatus
  assigned_to: string | null
  event_id: string | null
  fecha_programada: string | null
  fecha_realizacion: string | null
  notas: string | null
  created_at: string
  updated_at: string
  // Joined
  assignee?: Profile
}

export const PLAN_STATUSES: Record<PlanStatus, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  activo: { label: "Activo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  completado: { label: "Completado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  archivado: { label: "Archivado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
}

export const PLAN_TASK_TYPES: Record<PlanTaskType, { label: string; abbr: string; color: string }> = {
  visita: { label: "Visita", abbr: "V", color: "bg-purple-500" },
  medicion_iluminacion: { label: "Medición Iluminación", abbr: "I", color: "bg-yellow-500" },
  medicion_ruido: { label: "Medición Ruido", abbr: "R", color: "bg-blue-500" },
  medicion_pat: { label: "Medición PAT", abbr: "P", color: "bg-cyan-500" },
  carga_de_fuego: { label: "Carga de Fuego", abbr: "CF", color: "bg-orange-500" },
  relevamiento_riesgos: { label: "Relevamiento Riesgos", abbr: "RR", color: "bg-red-500" },
  checklist: { label: "Checklist", abbr: "CK", color: "bg-emerald-500" },
  capacitacion: { label: "Capacitación", abbr: "C", color: "bg-indigo-500" },
  simulacro: { label: "Simulacro", abbr: "S", color: "bg-pink-500" },
  auditoria: { label: "Auditoría", abbr: "A", color: "bg-amber-500" },
  otro: { label: "Otro", abbr: "O", color: "bg-gray-500" },
}

export const PLAN_TASK_STATUSES: Record<PlanTaskStatus, { label: string; color: string }> = {
  planificado: { label: "Planificado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  realizado: { label: "Realizado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

// --- Enhanced Events ---

export type EventStatus = "planificado" | "en_proceso" | "realizado" | "pendiente" | "cancelado"
export type EventRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly"

export interface EnhancedCalendarEvent extends CalendarEvent {
  status: EventStatus
  assigned_to: string | null
  end_date: string | null
  recurrence: EventRecurrence | null
  plan_task_id: string | null
  // Joined
  assignee?: Profile
  client?: Client
  establishment?: Establishment
}

export const EVENT_STATUSES: Record<EventStatus, { label: string; color: string }> = {
  planificado: { label: "Planificado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  realizado: { label: "Realizado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export const EVENT_RECURRENCES: Record<EventRecurrence, { label: string }> = {
  none: { label: "Sin repetición" },
  daily: { label: "Diario" },
  weekly: { label: "Semanal" },
  monthly: { label: "Mensual" },
  yearly: { label: "Anual" },
}

// --- Visits ---

export type VisitStatus = "borrador" | "firmado" | "enviado"

export interface Visit {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string
  fecha: string
  hora_ingreso: string | null
  hora_egreso: string | null
  motivo: string
  profesional_id: string
  acompanante: string | null
  acciones_realizadas: string | null
  status: VisitStatus
  firma_profesional_url: string | null
  firma_responsable_url: string | null
  plan_task_id: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  establishment?: Establishment
  profesional?: Profile
  observations?: VisitObservation[]
  _count?: { observations: number }
}

export type ObservationType = "observacion" | "recomendacion" | "no_conformidad" | "mejora"
export type ObservationPriority = "baja" | "media" | "alta" | "critica"

export interface VisitObservation {
  id: string
  visit_id: string
  organization_id: string
  tipo: ObservationType
  descripcion: string
  sector_id: string | null
  prioridad: ObservationPriority
  foto_url: string | null
  created_at: string
  // Joined
  sector?: DBSector
}

export const VISIT_STATUSES: Record<VisitStatus, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  firmado: { label: "Firmado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

export const OBSERVATION_TYPES: Record<ObservationType, { label: string; color: string }> = {
  observacion: { label: "Observación", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  recomendacion: { label: "Recomendación", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  no_conformidad: { label: "No Conformidad", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  mejora: { label: "Mejora", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
}

export const OBSERVATION_PRIORITIES: Record<ObservationPriority, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  media: { label: "Media", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

// --- Central Observations Hub ---

export type CentralObservationStatus = "abierta" | "en_proceso" | "resuelta" | "cerrada" | "vencida"
export type ObservationSourceType = "visita" | "checklist" | "medicion" | "riesgo" | "incidente" | "manual"
export type CentralObservationType = "observacion" | "recomendacion" | "no_conformidad" | "mejora" | "accion_correctiva"

export interface Observation {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string | null
  sector_id: string | null
  source_type: ObservationSourceType
  source_id: string | null
  titulo: string
  descripcion: string
  tipo: CentralObservationType
  prioridad: ObservationPriority
  status: CentralObservationStatus
  fecha_limite: string | null
  fecha_resolucion: string | null
  responsable_id: string | null
  resolucion_descripcion: string | null
  evidencia_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  establishment?: Establishment
  sector?: DBSector
  responsable?: Profile
}

export const OBSERVATION_STATUSES: Record<CentralObservationStatus, { label: string; color: string }> = {
  abierta: { label: "Abierta", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  en_proceso: { label: "En Proceso", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resuelta: { label: "Resuelta", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cerrada: { label: "Cerrada", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  vencida: { label: "Vencida", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

export const OBSERVATION_SOURCE_TYPES: Record<ObservationSourceType, { label: string; color: string }> = {
  visita: { label: "Visita", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  checklist: { label: "Checklist", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  medicion: { label: "Medición", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  riesgo: { label: "Riesgo", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  incidente: { label: "Incidente", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  manual: { label: "Manual", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

// --- Checklists ---

export type ChecklistCategory =
  | "condiciones_generales"
  | "incendio"
  | "electrico"
  | "maquinas"
  | "epp"
  | "orden_limpieza"
  | "ergonomia"
  | "construccion"
  | "matafuegos"
  | "personalizado"

export type ChecklistResponseType = "si_no_na" | "si_no" | "texto" | "numerico" | "seleccion" | "foto"
export type ChecklistStatus = "en_proceso" | "completado" | "firmado"

export interface ChecklistTemplate {
  id: string
  organization_id: string | null
  nombre: string
  descripcion: string | null
  normativa: string | null
  categoria: ChecklistCategory
  is_system: boolean
  version: number
  created_at: string
  updated_at: string
  // Joined
  items?: ChecklistTemplateItem[]
  _count?: { items: number }
}

export interface ChecklistTemplateItem {
  id: string
  template_id: string
  orden: number
  seccion: string | null
  pregunta: string
  tipo_respuesta: ChecklistResponseType
  opciones: string[] | null
  normativa_ref: string | null
  es_critico: boolean
  created_at: string
}

export interface Checklist {
  id: string
  organization_id: string
  template_id: string
  client_id: string
  establishment_id: string
  sector_id: string | null
  profesional_id: string
  fecha: string
  status: ChecklistStatus
  score_total: number | null
  items_total: number
  items_cumple: number
  items_no_cumple: number
  items_na: number
  notas: string | null
  visit_id: string | null
  plan_task_id: string | null
  created_at: string
  updated_at: string
  // Joined
  template?: ChecklistTemplate
  client?: Client
  establishment?: Establishment
  sector?: DBSector
  profesional?: Profile
  items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  template_item_id: string
  respuesta: string | null
  observacion: string | null
  foto_url: string | null
  observation_id: string | null
  created_at: string
  // Joined
  template_item?: ChecklistTemplateItem
}

export const CHECKLIST_CATEGORIES: Record<ChecklistCategory, { label: string }> = {
  condiciones_generales: { label: "Condiciones Generales de SHT" },
  incendio: { label: "Protección contra Incendios" },
  electrico: { label: "Instalaciones Eléctricas" },
  maquinas: { label: "Máquinas y Herramientas" },
  epp: { label: "Elementos de Protección Personal" },
  orden_limpieza: { label: "Orden y Limpieza" },
  ergonomia: { label: "Ergonomía" },
  construccion: { label: "Industria de la Construcción" },
  matafuegos: { label: "Control de Matafuegos" },
  personalizado: { label: "Personalizado" },
}

export const CHECKLIST_STATUSES: Record<ChecklistStatus, { label: string; color: string }> = {
  en_proceso: { label: "En Proceso", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  completado: { label: "Completado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  firmado: { label: "Firmado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

// --- Measurement Protocols ---

export type ProtocolType = "iluminacion" | "ruido" | "pat"
export type ProtocolStatus = "borrador" | "completado" | "firmado"

export interface MeasurementProtocol {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string
  tipo: ProtocolType
  profesional_id: string
  instrument_id: string
  fecha_medicion: string
  hora_inicio: string | null
  hora_fin: string | null
  condiciones_ambientales: string | null
  status: ProtocolStatus
  cumple_general: boolean | null
  porcentaje_cumplimiento: number | null
  puntos_total: number
  puntos_cumple: number
  puntos_no_cumple: number
  report_id: string | null
  visit_id: string | null
  plan_task_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  establishment?: Establishment
  profesional?: Profile
  instrument?: Instrument
  points?: MeasurementPoint[]
}

export interface MeasurementPoint {
  id: string
  protocol_id: string
  sector_id: string | null
  punto_nombre: string
  punto_numero: number | null
  // Illumination (Res 84/12)
  ilum_tipo_iluminacion: "natural" | "artificial" | "mixta" | null
  ilum_tipo_fuente: string | null
  ilum_valor_medido_lux: number | null
  ilum_valor_minimo_lux: number | null
  ilum_uniformidad: number | null
  ilum_tarea: string | null
  // Noise (Res 85/12)
  ruido_tipo_ruido: "continuo" | "intermitente" | "impulso" | null
  ruido_valor_medido_dba: number | null
  ruido_limite_dba: number | null
  ruido_tiempo_exposicion_hs: number | null
  ruido_dosis: number | null
  ruido_tipo_medicion: "puntual" | "dosimetria" | null
  // Grounding (PAT - AEA 90364)
  pat_valor_medido_ohm: number | null
  pat_valor_maximo_ohm: number | null
  pat_tipo_electrodo: string | null
  pat_profundidad_m: number | null
  pat_terreno: string | null
  // Common
  cumple: boolean | null
  observacion: string | null
  foto_url: string | null
  created_at: string
  // Joined
  sector?: DBSector
}

export const PROTOCOL_TYPES: Record<ProtocolType, { label: string; color: string; icon: string }> = {
  iluminacion: { label: "Iluminación", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "Sun" },
  ruido: { label: "Ruido", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "Volume2" },
  pat: { label: "Puesta a Tierra", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "Zap" },
}

export const PROTOCOL_STATUSES: Record<ProtocolStatus, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  completado: { label: "Completado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  firmado: { label: "Firmado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

// --- Normativa Reference Types ---

export interface NormativaIluminacion {
  id: number
  tarea: string
  tipo_edificio: string
  lux_minimo: number
  lux_recomendado: number | null
  normativa_ref: string
}

export interface NormativaRuido {
  id: number
  tipo_actividad: string
  duracion_hs: number
  limite_dba: number
  normativa_ref: string
}

// --- Month names helper ---
export const MESES: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
}

export const MESES_CORTOS: Record<number, string> = {
  1: "Ene",
  2: "Feb",
  3: "Mar",
  4: "Abr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
}

// =============================================
// Phase 3: Risk Assessments & Incidents
// =============================================

export interface RiskAssessment {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string
  sector_id: string | null
  profesional_id: string
  fecha: string
  titulo: string
  status: "borrador" | "completado" | "firmado"
  plan_task_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: Client
  establishment?: Establishment
  sector?: DBSector
  profesional?: Profile
  hazards?: Hazard[]
}

export type HazardCategoria =
  | "fisico"
  | "quimico"
  | "biologico"
  | "ergonomico"
  | "mecanico"
  | "electrico"
  | "incendio"
  | "locativo"
  | "psicosocial"
  | "natural"

export const HAZARD_CATEGORIAS: Record<HazardCategoria, string> = {
  fisico: "Físico",
  quimico: "Químico",
  biologico: "Biológico",
  ergonomico: "Ergonómico",
  mecanico: "Mecánico",
  electrico: "Eléctrico",
  incendio: "Incendio",
  locativo: "Locativo",
  psicosocial: "Psicosocial",
  natural: "Natural",
}

export type RiskClasificacion = "Tolerable" | "Moderado" | "Importante" | "Intolerable"

export const RISK_CLASIFICACION_COLORS: Record<RiskClasificacion, string> = {
  Tolerable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Moderado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Importante: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Intolerable: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export interface Hazard {
  id: string
  assessment_id: string
  work_position_id: string | null
  factor_riesgo: string
  categoria: HazardCategoria
  fuente: string | null
  efecto_posible: string | null
  // Probability sub-indices (1-10)
  indice_personas_expuestas: number | null
  indice_procedimientos: number | null
  indice_capacitacion: number | null
  indice_exposicion: number | null
  // Severity sub-index (1-10)
  indice_severidad: number | null
  // Calculated
  probabilidad: number | null
  nivel_riesgo: number | null
  clasificacion: RiskClasificacion | null
  // Corrective measure
  medida_correctiva: string | null
  responsable_mejora: string | null
  fecha_limite_mejora: string | null
  // Theoretical re-evaluation
  indice_personas_expuestas_teorico: number | null
  indice_procedimientos_teorico: number | null
  indice_capacitacion_teorico: number | null
  indice_exposicion_teorico: number | null
  indice_severidad_teorico: number | null
  probabilidad_teorica: number | null
  nivel_riesgo_teorico: number | null
  clasificacion_teorica: RiskClasificacion | null
  // Links
  observation_id: string | null
  created_at: string
  updated_at: string
  // Joined
  work_position?: WorkPosition
}

export type IncidentTipo = "accidente" | "incidente" | "enfermedad_profesional" | "casi_accidente"

export const INCIDENT_TIPOS: Record<IncidentTipo, string> = {
  accidente: "Accidente",
  incidente: "Incidente",
  enfermedad_profesional: "Enfermedad Profesional",
  casi_accidente: "Casi Accidente",
}

export type IncidentGravedad = "leve" | "moderada" | "grave" | "muy_grave" | "fatal"

export const INCIDENT_GRAVEDADES: Record<IncidentGravedad, string> = {
  leve: "Leve",
  moderada: "Moderada",
  grave: "Grave",
  muy_grave: "Muy Grave",
  fatal: "Fatal",
}

export const INCIDENT_GRAVEDAD_COLORS: Record<IncidentGravedad, string> = {
  leve: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  moderada: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  grave: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  muy_grave: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  fatal: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300",
}

export type IncidentStatus = "reportado" | "en_investigacion" | "cerrado"

export const INCIDENT_STATUSES: Record<IncidentStatus, string> = {
  reportado: "Reportado",
  en_investigacion: "En Investigación",
  cerrado: "Cerrado",
}

export interface Incident {
  id: string
  organization_id: string
  client_id: string
  establishment_id: string
  sector_id: string | null
  fecha: string
  hora: string | null
  tipo: IncidentTipo
  descripcion: string
  lugar_exacto: string | null
  nombre_afectado: string | null
  puesto_afectado: string | null
  antiguedad_meses: number | null
  tipo_lesion: string | null
  parte_cuerpo: string | null
  gravedad: IncidentGravedad | null
  dias_perdidos: number
  requirio_hospitalizacion: boolean
  investigador_id: string | null
  fecha_investigacion: string | null
  status: IncidentStatus
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  establishment?: Establishment
  sector?: DBSector
  investigador?: Profile
  causes?: IncidentCause[]
  casualties?: IncidentCasualty[]
}

export type CauseGrupo = "condiciones_inseguras" | "actos_inseguros" | "factores_personales" | "factores_trabajo"

export const CAUSE_GRUPOS: Record<CauseGrupo, string> = {
  condiciones_inseguras: "Condiciones Inseguras",
  actos_inseguros: "Actos Inseguros",
  factores_personales: "Factores Personales",
  factores_trabajo: "Factores del Trabajo",
}

export interface IncidentCause {
  id: string
  incident_id: string
  grupo: CauseGrupo
  descripcion: string
  es_causa_raiz: boolean
  medida_correctiva: string | null
  responsable: string | null
  fecha_limite: string | null
  observation_id: string | null
  created_at: string
}

export type CasualtyTipo = "muerte" | "incapacidad_permanente" | "incapacidad_temporal" | "atencion_medica"

export const CASUALTY_TIPOS: Record<CasualtyTipo, string> = {
  muerte: "Muerte",
  incapacidad_permanente: "Incapacidad Permanente",
  incapacidad_temporal: "Incapacidad Temporal",
  atencion_medica: "Atención Médica",
}

export interface IncidentCasualty {
  id: string
  incident_id: string
  nombre: string
  tipo: CasualtyTipo
  dias_perdidos: number
  created_at: string
}

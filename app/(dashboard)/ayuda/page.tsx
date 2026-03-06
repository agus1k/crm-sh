"use client"

import { useState, useMemo } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  Building2,
  FolderKanban,
  FileText,
  Calendar,
  CalendarRange,
  ClipboardCheck,
  ListChecks,
  Gauge,
  Eye,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Download,
  Settings,
  UserCircle,
  BookOpen,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Globe,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HelpCategory = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge?: string
}

type HelpArticle = {
  categoryId: string
  question: string
  answer: string
  tags: string[]
}

// ---------------------------------------------------------------------------
// Data — Categories
// ---------------------------------------------------------------------------

const categories: HelpCategory[] = [
  {
    id: "primeros-pasos",
    title: "Primeros pasos",
    description: "Cómo empezar a usar el sistema",
    icon: BookOpen,
    color: "text-blue-500 dark:text-blue-400",
    badge: "Nuevo",
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Gestión de clientes, establecimientos y sectores",
    icon: Building2,
    color: "text-emerald-500 dark:text-emerald-400",
  },
  {
    id: "proyectos",
    title: "Proyectos",
    description: "Creación y seguimiento de proyectos",
    icon: FolderKanban,
    color: "text-violet-500 dark:text-violet-400",
  },
  {
    id: "informes",
    title: "Informes",
    description: "Estudios de carga de fuego y otros informes",
    icon: FileText,
    color: "text-orange-500 dark:text-orange-400",
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendario, eventos e inspecciones",
    icon: Calendar,
    color: "text-pink-500 dark:text-pink-400",
  },
  {
    id: "plan-anual",
    title: "Plan Anual",
    description: "Planificación anual de actividades",
    icon: CalendarRange,
    color: "text-cyan-500 dark:text-cyan-400",
  },
  {
    id: "visitas",
    title: "Visitas",
    description: "Constancias de visita y observaciones",
    icon: ClipboardCheck,
    color: "text-teal-500 dark:text-teal-400",
  },
  {
    id: "checklists",
    title: "Checklists",
    description: "Verificaciones con plantillas predefinidas",
    icon: ListChecks,
    color: "text-indigo-500 dark:text-indigo-400",
  },
  {
    id: "mediciones",
    title: "Mediciones",
    description: "Protocolos de iluminación, ruido y PAT",
    icon: Gauge,
    color: "text-amber-500 dark:text-amber-400",
  },
  {
    id: "observaciones",
    title: "Observaciones",
    description: "Hub centralizado de hallazgos",
    icon: Eye,
    color: "text-lime-500 dark:text-lime-400",
  },
  {
    id: "riesgos",
    title: "Riesgos",
    description: "Matrices de evaluación de riesgos",
    icon: AlertTriangle,
    color: "text-yellow-500 dark:text-yellow-400",
  },
  {
    id: "incidentes",
    title: "Incidentes",
    description: "Investigación de accidentes e incidentes",
    icon: ShieldAlert,
    color: "text-red-500 dark:text-red-400",
  },
  {
    id: "pdfs",
    title: "Generación de PDFs",
    description: "Descargar informes en formato PDF",
    icon: Download,
    color: "text-sky-500 dark:text-sky-400",
  },
  {
    id: "portal",
    title: "Portal del Cliente",
    description: "Acceso de clientes al sistema",
    icon: Globe,
    color: "text-fuchsia-500 dark:text-fuchsia-400",
  },
  {
    id: "configuracion",
    title: "Configuración",
    description: "Ajustes de organización, perfil e instrumentos",
    icon: Settings,
    color: "text-stone-500 dark:text-stone-400",
  },
]

// ---------------------------------------------------------------------------
// Data — Articles (user-friendly, non-technical)
// ---------------------------------------------------------------------------

const articles: HelpArticle[] = [
  // --- Primeros pasos ---
  {
    categoryId: "primeros-pasos",
    question: "¿Cómo creo mi cuenta?",
    answer:
      "Ingresá a la página de registro, completá tu nombre, email y contraseña. Al registrarte se crea automáticamente tu organización y tu usuario queda como administrador. Después podés invitar a otros profesionales desde Configuración.",
    tags: ["registro", "cuenta", "organización", "inicio"],
  },
  {
    categoryId: "primeros-pasos",
    question: "¿Cuáles son los primeros pasos después de registrarme?",
    answer:
      "Te recomendamos seguir este orden:\n\n1. **Configuración** — Completá los datos de tu organización (nombre, CUIT, dirección) y tus credenciales profesionales (matrícula).\n2. **Instrumentos** — Si tenés equipos de medición, cargalos en Configuración > Instrumentos con sus datos de calibración.\n3. **Clientes** — Cargá tu primer cliente con sus establecimientos y sectores.\n4. **Plan Anual** — Creá tu plan anual de actividades.\n5. **Empezá a trabajar** — Agendá visitas, hacé checklists, tomá mediciones y generá informes.",
    tags: ["inicio", "primeros pasos", "orden", "guía"],
  },
  {
    categoryId: "primeros-pasos",
    question: "¿Qué roles existen en el sistema?",
    answer:
      "Hay tres roles:\n\n- **Administrador** — Acceso total al sistema. Puede crear usuarios, gestionar la organización y todos los módulos.\n- **Técnico** — Acceso al dashboard completo. Puede crear informes, visitas, mediciones, etc.\n- **Cliente** — Acceso limitado al Portal del Cliente (solo lectura). Ve sus informes, agenda y observaciones.",
    tags: ["roles", "administrador", "técnico", "cliente", "permisos"],
  },
  {
    categoryId: "primeros-pasos",
    question: "¿Cómo es el flujo general de trabajo?",
    answer:
      "El flujo típico de un profesional SHT es:\n\n1. **Planificar** — Crear el plan anual con las actividades programadas.\n2. **Agendar** — Las tareas del plan generan eventos en la agenda.\n3. **Visitar** — Realizar visitas a los establecimientos y documentarlas.\n4. **Evaluar** — Ejecutar checklists, tomar mediciones, evaluar riesgos.\n5. **Registrar** — Las observaciones se centralizan automáticamente.\n6. **Informar** — Generar informes técnicos y PDFs para el cliente.\n7. **Seguir** — Hacer seguimiento de las observaciones hasta su resolución.",
    tags: ["flujo", "trabajo", "proceso"],
  },

  // --- Clientes ---
  {
    categoryId: "clientes",
    question: "¿Cómo agrego un nuevo cliente?",
    answer:
      'Andá a **Clientes** en el menú lateral y hacé clic en **"Nuevo Cliente"**. Completá los datos: razón social, CUIT, datos de contacto (nombre, email, teléfono) y la dirección. Hacé clic en Guardar.',
    tags: ["cliente", "nuevo", "crear", "agregar"],
  },
  {
    categoryId: "clientes",
    question: "¿Qué son los establecimientos y sectores?",
    answer:
      "Un **establecimiento** es una ubicación física del cliente (sucursal, planta, oficina). Cada establecimiento puede tener **sectores** (áreas dentro del lugar, como \"Oficina administrativa\", \"Depósito\", \"Taller\"). Los sectores son importantes porque las mediciones, riesgos e informes se hacen por sector.",
    tags: ["establecimiento", "sector", "ubicación", "planta"],
  },
  {
    categoryId: "clientes",
    question: "¿Cómo cargo establecimientos y sectores?",
    answer:
      'Entrá al detalle de un cliente (hacé clic en su nombre), andá a la pestaña **"Establecimientos"** y hacé clic en **"Nuevo Establecimiento"**. Completá nombre, dirección y provincia. Una vez creado, entrá al establecimiento y agregá los sectores con nombre, superficie (m²) y actividad.',
    tags: ["establecimiento", "sector", "crear", "superficie"],
  },

  // --- Proyectos ---
  {
    categoryId: "proyectos",
    question: "¿Para qué sirven los proyectos?",
    answer:
      "Los proyectos te permiten agrupar el trabajo que hacés para un cliente. Por ejemplo: \"Relevamiento inicial 2026\" o \"Adecuación planta norte\". Un proyecto tiene un estado (activo, completado, archivado) y te ayuda a organizar informes y actividades relacionadas.",
    tags: ["proyecto", "organizar", "agrupar"],
  },
  {
    categoryId: "proyectos",
    question: "¿Cómo creo un proyecto?",
    answer:
      'Andá a **Proyectos** en el menú lateral, hacé clic en **"Nuevo Proyecto"**. Seleccioná el cliente, poné un nombre descriptivo y una descripción. El estado inicial es \"Activo\".',
    tags: ["proyecto", "nuevo", "crear"],
  },

  // --- Informes ---
  {
    categoryId: "informes",
    question: "¿Qué tipos de informes puedo generar?",
    answer:
      "Actualmente el sistema soporta el **Estudio de Carga de Fuego** según el Decreto 351/79 (Ley 19.587). Este es un informe completo con cálculos automáticos de resistencia al fuego, requerimiento de extintores y verificación de evacuación. En el futuro se agregarán más tipos.",
    tags: ["informe", "tipo", "carga de fuego"],
  },
  {
    categoryId: "informes",
    question: "¿Cómo hago un Estudio de Carga de Fuego?",
    answer:
      'Andá a **Informes > Carga de Fuego** en el menú lateral. Se abre un asistente de **8 pasos**:\n\n1. **Empresa** — Datos del cliente y establecimiento.\n2. **Profesionales** — Tus datos y matrícula.\n3. **Sectores** — Definir los sectores a evaluar.\n4. **Materiales** — Cargar los materiales combustibles por sector.\n5. **Extintores** — Registrar los matafuegos existentes.\n6. **Evacuación** — Datos de medios de escape.\n7. **Resultados** — El sistema calcula todo automáticamente.\n8. **Informe** — Vista previa y descarga del PDF.\n\nPodés ir y volver entre los pasos. El progreso se guarda automáticamente.',
    tags: ["carga de fuego", "pasos", "wizard", "asistente"],
  },
  {
    categoryId: "informes",
    question: "¿Qué significan los estados de un informe?",
    answer:
      "Los informes tienen 5 estados posibles:\n\n- **Borrador** — Estás trabajando en él. Podés editarlo.\n- **En revisión** — Lo enviaste a revisión (interna).\n- **Completado** — El informe está terminado y aprobado.\n- **Enviado** — Se lo entregaste al cliente.\n- **Vencido** — Pasó la fecha de vigencia.",
    tags: ["informe", "estado", "borrador", "completado", "enviado"],
  },

  // --- Agenda ---
  {
    categoryId: "agenda",
    question: "¿Cómo agendo una inspección?",
    answer:
      'Andá a **Agenda** en el menú lateral y hacé clic en **"Nuevo Evento"**. Seleccioná el tipo **"Inspección"**, elegí la fecha, el cliente y opcionalmente un establecimiento. Podés agregar notas y asignar el evento a un profesional.',
    tags: ["agenda", "evento", "inspección", "crear"],
  },
  {
    categoryId: "agenda",
    question: "¿Qué tipos de eventos puedo crear?",
    answer:
      "Hay 4 tipos de eventos:\n\n- **Inspección** — Visitas técnicas programadas.\n- **Vencimiento** — Recordatorios de vencimientos (informes, calibraciones, etc.).\n- **Reunión** — Reuniones con clientes o internas.\n- **Otro** — Cualquier otro tipo de evento.",
    tags: ["evento", "tipo", "inspección", "vencimiento", "reunión"],
  },
  {
    categoryId: "agenda",
    question: "¿Puedo crear eventos recurrentes?",
    answer:
      "Sí. Al crear un evento podés configurar la recurrencia: **diaria**, **semanal**, **mensual** o **anual**. Esto es útil para inspecciones periódicas o visitas de seguimiento.",
    tags: ["recurrencia", "evento", "periódico", "repetir"],
  },

  // --- Plan Anual ---
  {
    categoryId: "plan-anual",
    question: "¿Qué es el Plan Anual?",
    answer:
      "El Plan Anual es la planificación de todas las actividades de seguridad e higiene para un año. Incluye visitas, mediciones, capacitaciones, simulacros, auditorías, etc. Se visualiza como un **diagrama de Gantt** mensual para tener una vista rápida de todo el año.",
    tags: ["plan anual", "planificación", "gantt"],
  },
  {
    categoryId: "plan-anual",
    question: "¿Cómo creo un Plan Anual?",
    answer:
      'Andá a **Plan Anual** en el menú y hacé clic en **"Nuevo Plan"**. Seleccioná el año y el cliente. Después, dentro del plan, agregá tareas indicando el tipo de actividad, los meses en que se realizará, y opcionalmente un responsable.',
    tags: ["plan anual", "crear", "tarea"],
  },
  {
    categoryId: "plan-anual",
    question: "¿Puedo generar eventos automáticamente desde el plan?",
    answer:
      "Sí. Cada tarea del plan puede generar automáticamente un evento en la agenda. Esto te permite planificar una vez y tener todo reflejado en el calendario.",
    tags: ["plan anual", "evento", "automático", "agenda"],
  },

  // --- Visitas ---
  {
    categoryId: "visitas",
    question: "¿Qué es una Constancia de Visita?",
    answer:
      "Es un documento que registra una inspección o visita técnica a un establecimiento. Incluye la fecha, el motivo, las observaciones realizadas y puede descargarse como PDF para entregarlo al cliente firmado.",
    tags: ["visita", "constancia", "inspección"],
  },
  {
    categoryId: "visitas",
    question: "¿Cómo registro una visita?",
    answer:
      'Andá a **Visitas** y hacé clic en **"Nueva Visita"**. Seleccioná el cliente, el establecimiento, la fecha y el motivo. Una vez creada, entrá al detalle para agregar las observaciones que registraste durante la inspección.',
    tags: ["visita", "crear", "nueva", "observación"],
  },
  {
    categoryId: "visitas",
    question: "¿Puedo descargar la constancia como PDF?",
    answer:
      'Sí. Entrá al detalle de la visita y hacé clic en **"Generar PDF"**. Se descarga un documento con todos los datos de la visita, las observaciones y espacio para firmas.',
    tags: ["visita", "pdf", "descargar", "constancia"],
  },

  // --- Checklists ---
  {
    categoryId: "checklists",
    question: "¿Qué plantillas de checklist vienen incluidas?",
    answer:
      "El sistema incluye 3 plantillas predefinidas con 95 ítems de verificación en total:\n\n1. **Condiciones Generales de SHT** — Orden, limpieza, señalización, EPP, etc.\n2. **Protección contra Incendios** — Matafuegos, salidas de emergencia, detectores.\n3. **Instalaciones Eléctricas** — Tableros, conductores, puesta a tierra.\n\nTambién podés crear tus propias plantillas personalizadas.",
    tags: ["checklist", "plantilla", "predefinida", "verificación"],
  },
  {
    categoryId: "checklists",
    question: "¿Cómo ejecuto un checklist?",
    answer:
      'Andá a **Checklists** y hacé clic en **"Nuevo Checklist"**. Seleccioná el cliente, el establecimiento, el sector y la plantilla. Después completá cada ítem marcando **Cumple**, **No cumple** o **N/A**. El porcentaje de cumplimiento se calcula automáticamente.',
    tags: ["checklist", "ejecutar", "cumple", "verificación"],
  },
  {
    categoryId: "checklists",
    question: "¿Puedo crear mis propias plantillas?",
    answer:
      'Sí. Andá a **Checklists > Plantillas** en el menú y hacé clic en **"Nueva Plantilla"**. Agregá un nombre, descripción y los ítems de verificación que necesites. Después podés usar esa plantilla para crear checklists.',
    tags: ["checklist", "plantilla", "personalizada", "crear"],
  },

  // --- Mediciones ---
  {
    categoryId: "mediciones",
    question: "¿Qué tipos de mediciones puedo hacer?",
    answer:
      "El sistema soporta 3 tipos de protocolos de medición:\n\n| Protocolo | Normativa | Qué se mide |\n|-----------|-----------|-------------|\n| **Iluminación** | Res. SRT 84/12 | Niveles de lux en puntos de trabajo |\n| **Ruido** | Res. SRT 85/12 | Niveles de decibeles |\n| **PAT (Puesta a Tierra)** | Res. SRT | Resistencia en Ohm |",
    tags: ["medición", "protocolo", "iluminación", "ruido", "pat"],
  },
  {
    categoryId: "mediciones",
    question: "¿Cómo cargo una medición?",
    answer:
      'Andá a **Mediciones** y hacé clic en **"Nueva Medición"**. Seleccioná el tipo de protocolo, el cliente, el establecimiento y opcionalmente el instrumento de medición. Después agregá los puntos de medición con los valores obtenidos. El sistema compara automáticamente contra los valores de referencia normativos.',
    tags: ["medición", "crear", "nueva", "punto"],
  },
  {
    categoryId: "mediciones",
    question: "¿Cómo cargo mis instrumentos de medición?",
    answer:
      'Andá a **Configuración > Instrumentos** y hacé clic en **"Nuevo Instrumento"**. Completá la marca, modelo, número de serie y los datos de la última calibración (fecha, laboratorio, certificado). El sistema te avisará cuando la calibración esté por vencer.',
    tags: ["instrumento", "calibración", "medición", "equipo"],
  },

  // --- Observaciones ---
  {
    categoryId: "observaciones",
    question: "¿Qué es el Hub de Observaciones?",
    answer:
      "Es un módulo centralizado donde se reúnen **todos los hallazgos** del sistema, sin importar de dónde vengan (visitas, checklists, mediciones, riesgos, incidentes o cargadas manualmente). Esto te permite hacer seguimiento de cada observación hasta su resolución.",
    tags: ["observación", "hub", "hallazgo", "centralizado"],
  },
  {
    categoryId: "observaciones",
    question: "¿Qué tipos de observaciones existen?",
    answer:
      "Hay 4 tipos:\n\n- **Observación** — Un hallazgo general.\n- **Recomendación** — Una sugerencia de mejora.\n- **No conformidad** — Un incumplimiento normativo.\n- **Mejora** — Una oportunidad de mejora.\n\nCada una tiene una **prioridad** (baja, media, alta, crítica) y una **fecha límite** para su resolución.",
    tags: ["observación", "tipo", "prioridad", "no conformidad"],
  },
  {
    categoryId: "observaciones",
    question: "¿Cómo funciona el ciclo de vida de una observación?",
    answer:
      "Las observaciones siguen este flujo:\n\n**Abierta** → **En proceso** → **Resuelta** → **Cerrada**\n\nSi la fecha límite pasa sin que se resuelva, queda como **Vencida**. Podés filtrar por estado para ver qué observaciones necesitan atención.",
    tags: ["observación", "estado", "ciclo", "vencida"],
  },

  // --- Riesgos ---
  {
    categoryId: "riesgos",
    question: "¿Cómo funciona la Matriz de Riesgos?",
    answer:
      "La matriz evalúa riesgos con dos variables: **Probabilidad** (1-5) y **Severidad** (1-5). El resultado es un nivel de riesgo:\n\n- **Tolerable** (1-4) — Verde\n- **Moderado** (5-9) — Amarillo\n- **Importante** (10-16) — Naranja\n- **Intolerable** (17-25) — Rojo\n\nCada riesgo se asocia a un peligro identificado en un sector.",
    tags: ["riesgo", "matriz", "probabilidad", "severidad"],
  },
  {
    categoryId: "riesgos",
    question: "¿Cómo creo una evaluación de riesgos?",
    answer:
      'Andá a **Riesgos** y hacé clic en **"Nueva Evaluación"**. Seleccioná el cliente y el establecimiento. Después agregá los peligros identificados, indicando la categoría (físico, químico, biológico, ergonómico, etc.), la descripción del riesgo, y los valores de probabilidad y severidad.',
    tags: ["riesgo", "evaluación", "crear", "peligro"],
  },

  // --- Incidentes ---
  {
    categoryId: "incidentes",
    question: "¿Qué tipos de incidentes puedo registrar?",
    answer:
      "El sistema permite registrar 4 tipos:\n\n- **Accidente** — Evento que causó lesiones.\n- **Incidente** — Evento que pudo haber causado lesiones pero no lo hizo.\n- **Enfermedad profesional** — Enfermedad relacionada con el trabajo.\n- **Casi accidente** — Situación peligrosa sin consecuencias.",
    tags: ["incidente", "accidente", "tipo", "enfermedad"],
  },
  {
    categoryId: "incidentes",
    question: "¿Cómo investigo un incidente?",
    answer:
      'Andá a **Incidentes** y hacé clic en **"Nuevo Incidente"**. Completá los datos del evento (fecha, hora, lugar, tipo, gravedad, descripción). Después entrá al detalle para agregar:\n\n- **Causas** — Condiciones inseguras, actos inseguros, factores personales o de trabajo.\n- **Víctimas** — Datos de las personas afectadas, tipo de lesión y días perdidos.\n- **Acciones correctivas** — Se generan como observaciones para seguimiento.',
    tags: ["incidente", "investigación", "causa", "víctima"],
  },

  // --- PDFs ---
  {
    categoryId: "pdfs",
    question: "¿Qué documentos puedo descargar en PDF?",
    answer:
      "El sistema genera 8 tipos de PDF:\n\n1. **Estudio de Carga de Fuego** — Según Decreto 351/79\n2. **Protocolo de Iluminación** — Formato Res. SRT 84/12\n3. **Protocolo de Ruido** — Formato Res. SRT 85/12\n4. **Protocolo PAT** — Puesta a tierra\n5. **Checklist** — Resultados de verificación\n6. **Constancia de Visita** — Registro de inspección\n7. **Matriz de Riesgos** — Evaluación completa\n8. **Investigación de Incidente** — Informe de investigación",
    tags: ["pdf", "descargar", "documento", "generar"],
  },
  {
    categoryId: "pdfs",
    question: "¿Cómo descargo un PDF?",
    answer:
      'Entrá al detalle de cualquier registro (visita, checklist, medición, riesgo o incidente) y hacé clic en el botón **"Generar PDF"** o **"Descargar PDF"**. El archivo se genera en tu navegador y se descarga automáticamente. No necesitás conexión a internet para la generación.',
    tags: ["pdf", "descargar", "generar", "botón"],
  },

  // --- Portal del Cliente ---
  {
    categoryId: "portal",
    question: "¿Qué es el Portal del Cliente?",
    answer:
      "Es una vista simplificada del sistema, pensada para que tus clientes puedan ver la información que les corresponde. Los clientes acceden con su propio email y contraseña, y solo ven datos en modo lectura.",
    tags: ["portal", "cliente", "acceso", "lectura"],
  },
  {
    categoryId: "portal",
    question: "¿Qué puede ver el cliente en el portal?",
    answer:
      "El portal tiene 4 secciones:\n\n- **Informes** — Informes completados y enviados, con descarga de PDF.\n- **Agenda** — Eventos programados (próximos y pasados).\n- **Observaciones** — Hallazgos y su estado de resolución.\n- **Estadísticas** — Gráficos de cumplimiento y métricas generales.",
    tags: ["portal", "secciones", "informes", "agenda", "estadísticas"],
  },
  {
    categoryId: "portal",
    question: "¿Cómo doy acceso a un cliente?",
    answer:
      'El cliente necesita tener una cuenta registrada con el rol **"Cliente"**. Cuando se registra o es invitado con ese rol, automáticamente se lo redirige al Portal del Cliente en lugar del dashboard de técnicos.',
    tags: ["portal", "acceso", "invitar", "rol"],
  },

  // --- Configuración ---
  {
    categoryId: "configuracion",
    question: "¿Cómo cambio los datos de mi organización?",
    answer:
      'Andá a **Configuración** (ícono de engranaje en el menú) y en la pestaña **"Organización"** editá el nombre, CUIT, email, teléfono y dirección. Hacé clic en **Guardar**.',
    tags: ["configuración", "organización", "datos", "editar"],
  },
  {
    categoryId: "configuracion",
    question: "¿Cómo cargo mis credenciales profesionales?",
    answer:
      'En **Configuración > Credenciales**, podés agregar tus datos profesionales: tipo de matrícula, número, jurisdicción y fecha de vencimiento. Estos datos se usan en los informes PDF.',
    tags: ["credencial", "matrícula", "profesional"],
  },
  {
    categoryId: "configuracion",
    question: "¿Cómo cambio entre modo claro y oscuro?",
    answer:
      "Hacé clic en tu **avatar** (esquina superior derecha) y seleccioná **Apariencia**. Podés elegir entre Claro, Oscuro o Sistema (se adapta a la configuración de tu dispositivo).",
    tags: ["tema", "oscuro", "claro", "apariencia"],
  },
]

// ---------------------------------------------------------------------------
// Quick tips shown at the top
// ---------------------------------------------------------------------------

const quickTips = [
  {
    icon: Lightbulb,
    text: "Usá Cmd+K (o Ctrl+K) para abrir la búsqueda rápida desde cualquier pantalla.",
  },
  {
    icon: Lightbulb,
    text: "Las observaciones de visitas, checklists y mediciones se centralizan automáticamente en el Hub de Observaciones.",
  },
  {
    icon: Lightbulb,
    text: "Los PDFs se generan 100% en tu navegador — no se suben datos a ningún servidor externo.",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AyudaPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredArticles = useMemo(() => {
    const q = search.toLowerCase().trim()
    let result = articles

    if (activeCategory) {
      result = result.filter((a) => a.categoryId === activeCategory)
    }

    if (q) {
      result = result.filter(
        (a) =>
          a.question.toLowerCase().includes(q) ||
          a.answer.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q))
      )
    }

    return result
  }, [search, activeCategory])

  const activeCategoryData = categories.find((c) => c.id === activeCategory)

  return (
    <>
      <Topbar
        title="Centro de Ayuda"
        description="Guías y respuestas para usar el sistema"
      />

      <div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">
        {/* ---------- Hero / Search ---------- */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-primary/10 dark:via-background dark:to-primary/10 p-6 sm:p-10 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            ¿En qué podemos ayudarte?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Buscá por tema o explorá las categorías para encontrar lo que necesitás.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar en la ayuda..."
              className="pl-10 pr-4 h-11 rounded-full bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ---------- Quick Tips ---------- */}
        <div className="grid gap-3 sm:grid-cols-3">
          {quickTips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <tip.icon className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tip.text}
              </p>
            </div>
          ))}
        </div>

        {/* ---------- Category Grid ---------- */}
        {!activeCategory && !search && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Explorar por módulo
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const count = articles.filter(
                    (a) => a.categoryId === cat.id
                  ).length
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm hover:bg-accent/30"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 dark:bg-muted/40 ${cat.color} transition-colors group-hover:bg-primary/10`}
                      >
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {cat.title}
                          </span>
                          {cat.badge && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {cat.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                        <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                          {count} {count === 1 ? "artículo" : "artículos"}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ---------- Active Category Header ---------- */}
        {(activeCategory || search) && (
          <div>
            {activeCategory && activeCategoryData && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setActiveCategory(null)
                    setSearch("")
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Todas las categorías
                </button>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                <div className="flex items-center gap-2">
                  <activeCategoryData.icon
                    className={`h-4 w-4 ${activeCategoryData.color}`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {activeCategoryData.title}
                  </span>
                </div>
              </div>
            )}

            {search && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "resultado" : "resultados"}{" "}
                para &quot;{search}&quot;
                {activeCategory && activeCategoryData
                  ? ` en ${activeCategoryData.title}`
                  : ""}
              </p>
            )}

            {filteredArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  No encontramos resultados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Intentá con otros términos o explorá las categorías.
                </p>
                <button
                  onClick={() => {
                    setSearch("")
                    setActiveCategory(null)
                  }}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Ver todas las categorías
                </button>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {filteredArticles.map((article, i) => {
                  const cat = categories.find(
                    (c) => c.id === article.categoryId
                  )
                  return (
                    <AccordionItem
                      key={`${article.categoryId}-${i}`}
                      value={`${article.categoryId}-${i}`}
                      className="rounded-lg border border-border bg-card px-4 data-[state=open]:bg-accent/20 transition-colors"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline gap-3 [&>svg]:shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                          {!activeCategory && cat && (
                            <cat.icon
                              className={`h-4 w-4 shrink-0 ${cat.color}`}
                            />
                          )}
                          <span className="truncate">{article.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {article.answer}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}

            {/* Back link at bottom */}
            {activeCategory && (
              <button
                onClick={() => {
                  setActiveCategory(null)
                  setSearch("")
                }}
                className="mt-6 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                Volver a todas las categorías
              </button>
            )}
          </div>
        )}

        {/* ---------- Footer ---------- */}
        <Separator />
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground">
            ¿No encontrás lo que buscás? Contactá a soporte en{" "}
            <span className="text-foreground font-medium">
              soporte@crm-sh.com
            </span>
          </p>
        </div>
      </div>
    </>
  )
}

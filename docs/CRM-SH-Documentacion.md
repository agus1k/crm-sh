# CRM-SH — Documentacion Completa

## Sistema de Gestion para Seguridad e Higiene

**Version:** 1.0 (Fases 1-4 completadas)
**Fecha:** Marzo 2026
**Stack:** Next.js 16 + React 19 + Supabase + TypeScript

---

## Tabla de Contenidos

1. [Descripcion General](#1-descripcion-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Autenticacion y Roles](#4-autenticacion-y-roles)
5. [Modulos del Sistema](#5-modulos-del-sistema)
6. [Portal del Cliente](#6-portal-del-cliente)
7. [Generacion de PDFs](#7-generacion-de-pdfs)
8. [Almacenamiento (Storage)](#8-almacenamiento-storage)
9. [Guia de Instalacion](#9-guia-de-instalacion)
10. [Guia de Desarrollo](#10-guia-de-desarrollo)
11. [Estructura del Proyecto](#11-estructura-del-proyecto)
12. [Referencia de la Base de Datos](#12-referencia-de-la-base-de-datos)
13. [Patrones y Convenciones](#13-patrones-y-convenciones)
14. [Resolucion de Problemas](#14-resolucion-de-problemas)
15. [Proximos Pasos (Fase 5)](#15-proximos-pasos-fase-5)

---

## 1. Descripcion General

### Que es CRM-SH?

CRM-SH es un sistema SaaS (Software as a Service) disenado para profesionales de **Seguridad e Higiene** en Argentina. Permite gestionar todo el ciclo de trabajo del profesional SHT (Seguridad e Higiene en el Trabajo), desde la planificacion anual hasta la generacion de informes tecnicos en formato PDF.

### Problema que resuelve

Los profesionales de SHT en Argentina gestionan multiples clientes, establecimientos, visitas, mediciones, checklists, y deben generar informes regulados (Decreto 351/79, Ley 19.587, Res. SRT 84/12, 85/12). CRM-SH centraliza todo esto en una sola plataforma.

### Funcionalidades principales

| Modulo | Descripcion |
|--------|-------------|
| **Clientes** | Gestion de clientes con establecimientos y sectores |
| **Plan Anual** | Planificacion anual de actividades con vista Gantt |
| **Agenda** | Calendario de eventos, visitas, inspecciones |
| **Visitas** | Constancias de visita con observaciones |
| **Checklists** | Verificaciones con plantillas predefinidas y personalizadas |
| **Mediciones** | Protocolos de iluminacion, ruido, y puesta a tierra (PAT) |
| **Observaciones** | Hub centralizado de hallazgos y no conformidades |
| **Riesgos** | Matriz de evaluacion de riesgos (probabilidad x severidad) |
| **Incidentes** | Investigacion de accidentes e incidentes |
| **Informes** | Estudios de carga de fuego (Decreto 351/79) |
| **PDFs** | Generacion de 8 tipos de documentos PDF |
| **Portal** | Portal de acceso para clientes (solo lectura) |

### Metricas del proyecto

- **150+ archivos de codigo fuente** (.ts/.tsx)
- **28 rutas de pagina** (dashboard + portal)
- **30+ tablas** en la base de datos
- **8 plantillas PDF**
- **48 componentes UI** (shadcn/ui)
- **5 buckets de almacenamiento**

---

## 2. Arquitectura del Sistema

### Stack tecnologico

```
Frontend          Backend           Infraestructura
-----------       ----------        ----------------
Next.js 16.1      Supabase Auth     Supabase (Cloud)
React 19          PostgreSQL        Vercel (Deploy)
TypeScript 5.7    Supabase RLS      Edge Functions
Tailwind CSS 3.4  Supabase Storage
shadcn/ui
Zustand 5
@react-pdf/renderer
```

### Diagrama de arquitectura

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Dashboard  │  │  Portal   │  │ Auth Pages   │ │
│  │ (tecnico)  │  │ (cliente) │  │ (publicas)   │ │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│        │              │               │          │
│        └──────────┬───┘───────────────┘          │
│                   │                              │
│        ┌──────────▼──────────┐                   │
│        │ Supabase Client     │                   │
│        │ (Browser / SSR)     │                   │
│        └──────────┬──────────┘                   │
└───────────────────┼─────────────────────────────┘
                    │ HTTPS
┌───────────────────┼─────────────────────────────┐
│                   │     SUPABASE                 │
│        ┌──────────▼──────────┐                   │
│        │   Supabase Auth     │                   │
│        └──────────┬──────────┘                   │
│                   │                              │
│   ┌───────────────┼───────────────┐              │
│   │               │               │              │
│   ▼               ▼               ▼              │
│ PostgreSQL    Storage API    Edge Functions       │
│ (30+ tablas)  (5 buckets)   (futuro)             │
│ + RLS         + RLS                              │
└─────────────────────────────────────────────────┘
```

### Patron de carpetas

El proyecto usa el **App Router** de Next.js con tres grupos de rutas:

- `(auth)/` — Paginas publicas (login, register)
- `(dashboard)/` — Paginas protegidas para tecnicos y admins
- `portal/` — Paginas protegidas para clientes (solo lectura)

### Manejo de estado

- **Zustand** para estado global del cliente:
  - `auth-store.ts` — Usuario, perfil, organizacion, sesion
  - `app-store.ts` — Estado general de la aplicacion
  - `form-store.ts` (via `lib/store.ts`) — Estado del formulario de carga de fuego

- **Supabase** para datos persistentes (todas las queries son client-side con `createClient()`)

---

## 3. Modelo de Datos

### Diagrama de relaciones

```
organizations (multi-tenant)
  ├── profiles (usuarios)
  ├── clients (clientes)
  │     ├── establishments (establecimientos)
  │     │     └── sectors (sectores)
  │     │     └── work_positions (puestos de trabajo)
  │     ├── projects (proyectos)
  │     ├── reports (informes)
  │     ├── events (eventos/agenda)
  │     ├── visits (constancias de visita)
  │     │     └── visit_observations
  │     ├── checklists
  │     │     └── checklist_items
  │     ├── measurement_protocols
  │     │     └── measurement_points
  │     ├── observations (hub centralizado)
  │     ├── risk_assessments
  │     │     └── hazards
  │     └── incidents
  │           ├── incident_causes
  │           └── incident_casualties
  ├── annual_plans
  │     └── plan_tasks
  ├── professional_credentials
  ├── instruments
  │     └── instrument_calibrations
  ├── org_settings
  ├── checklist_templates (3 predefinidas + custom)
  │     └── checklist_template_items (95 items predefinidos)
  └── reference tables (normativa_iluminacion, normativa_ruido)
```

### Tablas principales

| Tabla | Descripcion | Registros clave |
|-------|-------------|-----------------|
| `organizations` | Organizaciones multi-tenant | `name`, `cuit`, `subscription_plan` |
| `profiles` | Usuarios (extend auth.users) | `role` (admin/tecnico/cliente), `matricula` |
| `clients` | Clientes de la org | `razon_social`, `cuit`, `contacto_*` |
| `establishments` | Establecimientos/sucursales | `nombre`, `direccion`, `provincia` |
| `sectors` | Sectores dentro de establecimientos | `nombre`, `superficie`, `actividad` |
| `reports` | Informes tecnicos | `report_type`, `status`, `form_data` (JSON) |
| `events` | Eventos del calendario | `event_type`, `event_date`, `status` |
| `visits` | Constancias de visita | `fecha_visita`, `motivo`, `status` |
| `checklists` | Verificaciones ejecutadas | `template_id`, `porcentaje_cumplimiento` |
| `measurement_protocols` | Mediciones tecnicas | `tipo` (iluminacion/ruido/pat), `cumple_general` |
| `observations` | Hub de observaciones | `tipo`, `prioridad`, `status`, `source_type` |
| `risk_assessments` | Matrices de riesgo | `fecha_evaluacion`, `estado` |
| `incidents` | Accidentes e incidentes | `tipo`, `gravedad`, `fecha_hora` |
| `annual_plans` | Planes anuales | `anio`, `status`, tasks asociadas |

### Workflow de estados

**Informes (Reports):**
```
borrador → en_revision → completado → enviado → vencido
```

**Constancias de visita (Visits):**
```
borrador → firmado → enviado
```

**Protocolos de medicion:**
```
borrador → completado → firmado
```

**Observaciones:**
```
abierta → en_proceso → resuelta → cerrada
                    ↘ vencida (automatico si pasa fecha limite)
```

**Incidentes:**
```
reportado → en_investigacion → cerrado
```

---

## 4. Autenticacion y Roles

### Flujo de autenticacion

1. El usuario ingresa a `/login` o `/register`
2. Supabase Auth maneja la autenticacion por email/password
3. El middleware SSR (`lib/supabase/middleware.ts`) intercepta todas las requests:
   - Refresca tokens de sesion automaticamente
   - Redirige segun el rol del usuario:
     - `admin` / `tecnico` → `/(dashboard)/`
     - `cliente` → `/portal/`
4. El `AuthGuard` (dashboard) o `PortalGuard` (portal) carga el perfil y organizacion en el store de Zustand

### Roles del sistema

| Rol | Acceso | Descripcion |
|-----|--------|-------------|
| `admin` | Dashboard completo | Administrador de la organizacion. CRUD total. |
| `tecnico` | Dashboard completo | Profesional SHT. Crea informes, visitas, mediciones. |
| `cliente` | Portal (solo lectura) | Cliente de la organizacion. Ve informes, agenda, observaciones. |

### RLS (Row Level Security)

Todas las tablas usan RLS con el patron:

```sql
-- Lectura: miembros de la misma organizacion
CREATE POLICY "select_policy" ON tabla FOR SELECT
  USING (organization_id = public.get_user_organization_id());

-- Escritura: misma organizacion (admin/tecnico)
CREATE POLICY "insert_policy" ON tabla FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());
```

La funcion `get_user_organization_id()` es SECURITY DEFINER y evita la recursion infinita que ocurre con subqueries directas a `profiles`.

### Trigger de registro

Cuando un usuario se registra:
1. `handle_new_user` — Crea el perfil en `profiles`
2. `handle_new_profile` — Crea la organizacion y asigna el rol `admin`

---

## 5. Modulos del Sistema

### 5.1 Dashboard Principal (`/`)

La pagina principal muestra:
- **4 tarjetas de estadisticas**: clientes activos, informes del mes, eventos de la semana, observaciones pendientes
- **Actividad reciente**: ultimos informes y observaciones
- **Proximos eventos**: calendario semanal

### 5.2 Clientes (`/clientes`)

- Listado con busqueda y filtros
- Detalle del cliente (`/clientes/[id]`) con tabs:
  - Datos generales (razon social, CUIT, contacto)
  - Establecimientos y sectores (drill-down a `/clientes/[id]/establecimientos/[estId]`)
  - Proyectos asociados
  - Informes del cliente
  - Observaciones del cliente

### 5.3 Plan Anual (`/plan-anual`)

- Listado de planes por anio
- Detalle (`/plan-anual/[id]`) con vista **Gantt** mensual
- 11 tipos de tareas: visita, mediciones, carga de fuego, checklist, capacitacion, simulacro, auditoria, etc.
- Cada tarea puede generar automaticamente un evento en la agenda

### 5.4 Agenda (`/agenda`)

- Vista de calendario con eventos coloreados por tipo
- Filtros por tipo (inspeccion, vencimiento, reunion, otro) y estado
- 5 estados: planificado, en_proceso, realizado, pendiente, cancelado
- Recurrencia: ninguna, diario, semanal, mensual, anual

### 5.5 Visitas (`/visitas`)

- Constancias de visita para documentar inspecciones
- Detalle (`/visitas/[id]`) con:
  - Datos de la visita (fecha, establecimiento, motivo)
  - Observaciones registradas durante la visita
  - Boton "Generar PDF" para descargar constancia

### 5.6 Checklists (`/checklists`)

- 3 plantillas predefinidas del sistema (95 items totales):
  - Condiciones Generales de SHT
  - Proteccion contra Incendios
  - Instalaciones Electricas
- Ejecucion de checklists con items de verificacion (cumple/no cumple/N/A)
- Porcentaje de cumplimiento calculado automaticamente
- Detalle (`/checklists/[id]`) con boton PDF

### 5.7 Mediciones (`/mediciones`)

Tres tipos de protocolos:

| Protocolo | Normativa | Datos |
|-----------|-----------|-------|
| **Iluminacion** | Decreto 351/79, Res. 84/12 | Puntos con lux medidos vs. requeridos |
| **Ruido** | Decreto 351/79, Res. 85/12 | Puntos con dB medidos vs. limite |
| **PAT (Puesta a Tierra)** | Res. SRT | Puntos con Ohm medidos vs. limite |

- Cada medicion puede vincularse a un instrumento calibrado
- Detalle (`/mediciones/[id]`) con resultados y boton PDF

### 5.8 Observaciones (`/observaciones`)

Hub centralizado que recoge hallazgos de todos los modulos:

- **Fuentes**: visita, checklist, medicion, riesgo, incidente, manual
- **Tipos**: observacion, recomendacion, no conformidad, mejora
- **Prioridades**: baja, media, alta, critica
- **Estados**: abierta → en_proceso → resuelta → cerrada / vencida
- Fecha limite con indicador visual de vencimiento

### 5.9 Riesgos (`/riesgos`)

- Matrices de evaluacion de riesgos
- Cada riesgo tiene: peligro, riesgo, probabilidad, severidad
- Clasificacion automatica: Tolerable / Moderado / Importante / Intolerable
- 10 categorias de peligros (fisico, quimico, biologico, ergonomico, etc.)
- Detalle (`/riesgos/[id]`) con lista de hazards y boton PDF

### 5.10 Incidentes (`/incidentes`)

- Investigacion de accidentes/incidentes laborales
- Tipos: accidente, incidente, enfermedad profesional, casi accidente
- Gravedad: leve, moderada, grave, muy grave, fatal
- Cada incidente puede tener:
  - Causas (condiciones inseguras, actos inseguros, factores personales/trabajo)
  - Victimas (con tipo de lesion y dias perdidos)
- Detalle (`/incidentes/[id]`) con boton PDF

### 5.11 Informes (`/informes`)

- Listado de informes tecnicos con filtros por tipo y estado
- **Estudio de Carga de Fuego** (`/informes/nuevo/carga-de-fuego`):
  - Wizard de 8 pasos guiados
  - Calculos automaticos segun Decreto 351/79
  - Determinacion de resistencia al fuego
  - Calculo de cantidad de extintores
  - Verificacion de evacuacion

### 5.12 Configuracion (`/configuracion`)

Pagina con tabs:
- **Organizacion**: nombre, CUIT, datos de contacto
- **Credenciales profesionales**: matriculas, registros
- **Instrumentos**: equipos de medicion con control de calibracion
- **Perfil**: datos del usuario

---

## 6. Portal del Cliente

### Acceso

Los usuarios con rol `cliente` son redirigidos automaticamente a `/portal` por el middleware. No tienen acceso al dashboard de tecnicos.

### Paginas del portal

| Ruta | Descripcion |
|------|-------------|
| `/portal` | Dashboard con estadisticas y accesos rapidos |
| `/portal/informes` | Lista de informes/protocolos completados con descarga PDF |
| `/portal/agenda` | Eventos programados (proximos y pasados) |
| `/portal/observaciones` | Observaciones con estadisticas de estado |
| `/portal/estadisticas` | Graficos de cumplimiento y metricas |

### Restricciones

- **Todo es solo lectura** — los clientes no pueden crear ni editar datos
- Los clientes solo ven datos de su propia organizacion (via RLS)
- Solo ven informes con status `completado` o `enviado`
- Solo ven protocolos con status `completado` o `firmado`

### Componentes del portal

- `components/portal/portal-header.tsx` — Header sticky con navegacion y menu de usuario
- `components/portal/stat-cards.tsx` — Tarjetas de estadisticas reutilizables

---

## 7. Generacion de PDFs

### Motor de PDF

Usamos `@react-pdf/renderer` (v4.3.2) para generar PDFs 100% client-side. El PDF se genera como un componente React y se descarga directamente en el navegador.

### Arquitectura

```
lib/pdf/
  pdf-engine.tsx      # Componentes compartidos (PDFHeader, PDFFooter, PDFTable, etc.)
  pdf-styles.ts       # Estilos globales
  templates/
    carga-de-fuego.tsx           # Estudio de carga de fuego
    protocolo-iluminacion.tsx    # Protocolo Res. 84/12
    protocolo-ruido.tsx          # Protocolo Res. 85/12
    protocolo-pat.tsx            # Protocolo PAT
    checklist.tsx                # Verificacion de checklist
    constancia-visita.tsx        # Constancia de visita
    matriz-riesgos.tsx           # Matriz de evaluacion de riesgos
    investigacion-incidente.tsx  # Informe de investigacion de incidente

hooks/
  use-pdf-generator.ts   # Hook para generar y descargar PDFs
```

### Uso en componentes

```tsx
import { usePdfGenerator } from "@/hooks/use-pdf-generator"
import { ConstanciaVisitaPDF } from "@/lib/pdf/templates/constancia-visita"

function VisitDetailPage() {
  const { generatePDF, isGenerating } = usePdfGenerator()

  const handleDownload = () => {
    generatePDF(
      <ConstanciaVisitaPDF data={visitData} />,
      `constancia-visita-${visit.id}.pdf`
    )
  }

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? "Generando..." : "Descargar PDF"}
    </Button>
  )
}
```

### 8 plantillas disponibles

| Plantilla | Formato | Normativa |
|-----------|---------|-----------|
| Carga de Fuego | A4 vertical | Decreto 351/79, Ley 19.587 |
| Protocolo Iluminacion | A4 horizontal | Res. SRT 84/12 |
| Protocolo Ruido | A4 horizontal | Res. SRT 85/12 |
| Protocolo PAT | A4 vertical | Res. SRT |
| Checklist | A4 vertical | Items personalizados |
| Constancia de Visita | A4 vertical | Libre |
| Matriz de Riesgos | A4 horizontal | Metodologia probabilidad x severidad |
| Investigacion de Incidente | A4 vertical | Formato investigacion |

---

## 8. Almacenamiento (Storage)

### Buckets configurados

| Bucket | Contenido | Tamano max | Formatos |
|--------|-----------|------------|----------|
| `reports` | PDFs generados | 10 MB | PDF |
| `calibrations` | Certificados de calibracion | 10 MB | PDF, JPG, PNG, WebP |
| `evidence` | Fotos de evidencia (observaciones) | 10 MB | JPG, PNG, WebP, PDF |
| `logos` | Logos de organizaciones | 2 MB | JPG, PNG, SVG, WebP |
| `signatures` | Firmas digitales | 2 MB | PNG, SVG, WebP |

### Estructura de archivos

Todos los archivos se almacenan bajo el `organization_id` como carpeta raiz:

```
{bucket}/
  {organization_id}/
    {subcarpeta}/
      archivo.ext
```

Ejemplo: `reports/550e8400-e29b-41d4-a716-446655440000/visita-2026-03-06.pdf`

### Politicas RLS

- Miembros de la organizacion pueden leer y escribir archivos de su org
- Los clientes del portal solo pueden leer archivos del bucket `reports`

---

## 9. Guia de Instalacion

### Prerequisitos

- Node.js 18+
- npm 9+
- Cuenta en Supabase (gratuita o de pago)

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repo>
cd crm-sh
```

### Paso 2: Instalar dependencias

```bash
npm install --legacy-peer-deps
```

> **Nota:** El flag `--legacy-peer-deps` es necesario por un conflicto entre `react-day-picker@8.10.1` y `date-fns@4.1.0`.

### Paso 3: Configurar variables de entorno

Crear `.env.local` en la raiz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Paso 4: Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ejecutar las migraciones SQL en orden (ver seccion 12)
3. Habilitar RLS en todas las tablas
4. Configurar los buckets de Storage (ver seccion 8)

### Paso 5: Ejecutar en desarrollo

```bash
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`.

### Paso 6: Build de produccion

```bash
npm run build
npm start
```

---

## 10. Guia de Desarrollo

### Crear una nueva pagina

1. Crear el directorio bajo `app/(dashboard)/tu-modulo/`
2. Crear `page.tsx` con el patron estandar:

```tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Topbar } from "@/components/layout/topbar"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function MiModuloPage() {
  const { profile } = useAuthStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!profile?.organization_id) {
        setLoading(false)  // CRITICO: siempre llamar setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("mi_tabla")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(`Error al cargar datos: ${error.message}`)
      } else {
        setData(data || [])
      }
      setLoading(false)
    }
    load()
  }, [profile?.organization_id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Topbar title="Mi Modulo" description="Descripcion del modulo" />
      <div className="p-6 space-y-6">
        {/* Contenido */}
      </div>
    </>
  )
}
```

### Agregar un componente shadcn/ui

```bash
npx shadcn@latest add nombre-componente
```

Los componentes se instalan en `components/ui/`.

### Crear una nueva plantilla PDF

1. Crear el archivo en `lib/pdf/templates/mi-template.tsx`
2. Usar los componentes compartidos de `pdf-engine.tsx`:
   - `PDFHeader` — Encabezado con logo y datos de la org
   - `PDFFooter` — Pie de pagina con numero de pagina
   - `PDFTable` — Tabla con columnas configurables
   - `PDFSection` — Seccion con titulo
   - `PDFBadge` — Badge con color
3. Importar y usar desde el hook `usePdfGenerator`

### Trabajar con los mapas de constantes

Los mapas en `lib/crm-types.ts` retornan **objetos**, no strings:

```tsx
// INCORRECTO ❌
<span>{REPORT_TYPES[tipo]}</span>

// CORRECTO ✅
<span>{REPORT_TYPES[tipo]?.label}</span>
<span className={REPORT_TYPES[tipo]?.color}>...</span>
```

Excepcion: `HAZARD_CATEGORIAS`, `INCIDENT_TIPOS`, `INCIDENT_GRAVEDADES`, `INCIDENT_STATUSES`, `CAUSE_GRUPOS`, `CASUALTY_TIPOS` retornan strings directamente.

---

## 11. Estructura del Proyecto

```
crm-sh/
├── app/
│   ├── layout.tsx                    # Layout raiz (ThemeProvider, fonts)
│   ├── (auth)/
│   │   ├── layout.tsx                # Layout de auth (centrado, sin sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Layout con AuthGuard + Sidebar
│   │   ├── page.tsx                  # Dashboard principal
│   │   ├── agenda/page.tsx
│   │   ├── checklists/
│   │   │   ├── page.tsx              # Lista de checklists
│   │   │   ├── [id]/page.tsx         # Detalle + PDF
│   │   │   └── plantillas/
│   │   │       ├── page.tsx          # Lista de plantillas
│   │   │       └── [id]/page.tsx     # Detalle de plantilla
│   │   ├── clientes/
│   │   │   ├── page.tsx              # Lista de clientes
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detalle de cliente
│   │   │       └── establecimientos/
│   │   │           └── [estId]/page.tsx  # Detalle de establecimiento
│   │   ├── configuracion/page.tsx
│   │   ├── incidentes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── informes/
│   │   │   ├── page.tsx
│   │   │   └── nuevo/carga-de-fuego/page.tsx  # Wizard 8 pasos
│   │   ├── mediciones/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── observaciones/page.tsx
│   │   ├── plan-anual/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── proyectos/page.tsx
│   │   ├── riesgos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── visitas/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── portal/
│       ├── layout.tsx                # Layout con PortalGuard + Header
│       ├── page.tsx                  # Dashboard del portal
│       ├── agenda/page.tsx
│       ├── estadisticas/page.tsx
│       ├── informes/page.tsx
│       └── observaciones/page.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx               # Sidebar del dashboard (12 items)
│   │   └── topbar.tsx                # Barra superior de pagina
│   ├── portal/
│   │   ├── portal-header.tsx         # Header del portal
│   │   └── stat-cards.tsx            # Tarjetas de estadisticas
│   ├── steps/                        # 8 pasos del wizard de carga de fuego
│   │   ├── step-empresa.tsx
│   │   ├── step-profesionales.tsx
│   │   ├── step-sectores.tsx
│   │   ├── step-materiales.tsx
│   │   ├── step-extintores.tsx
│   │   ├── step-evacuacion.tsx
│   │   ├── step-resultados.tsx
│   │   └── step-informe.tsx
│   ├── theme-provider.tsx
│   └── ui/                           # 48 componentes shadcn/ui
├── hooks/
│   ├── use-mobile.ts
│   └── use-pdf-generator.ts
├── lib/
│   ├── calculos.ts                   # Motor de calculo de carga de fuego
│   ├── crm-types.ts                  # ~1000 lineas de tipos + constantes
│   ├── normativa.ts                  # Datos normativos (Dec. 351/79)
│   ├── types.ts                      # Tipos del estudio de carga de fuego
│   ├── store.ts                      # Valores por defecto, steps del wizard
│   ├── utils.ts                      # cn() utility
│   ├── pdf/
│   │   ├── pdf-engine.tsx            # Componentes PDF compartidos
│   │   ├── pdf-styles.ts             # Estilos globales PDF
│   │   └── templates/                # 8 plantillas PDF
│   ├── stores/
│   │   ├── auth-store.ts             # Zustand: auth + perfil + org
│   │   └── app-store.ts              # Zustand: estado de la app
│   └── supabase/
│       ├── client.ts                 # Cliente browser
│       ├── server.ts                 # Cliente SSR
│       └── middleware.ts             # Middleware con role-based routing
├── middleware.ts                      # Entry point del middleware
├── tasks/
│   ├── todo.md                       # Tracker de progreso
│   └── lessons.md                    # Lecciones aprendidas
├── plan.md                           # Plan maestro (2332 lineas)
├── agents.md                         # Contexto para agentes AI
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. Referencia de la Base de Datos

### Migraciones aplicadas (en orden)

| # | Nombre | Descripcion |
|---|--------|-------------|
| 1 | `create_base_tables` | organizations, profiles, clients, projects, reports, events |
| 2 | `add_settings_and_credentials` | org_settings, professional_credentials, instruments, calibrations |
| 3 | `add_establishments_hierarchy` | establishments, sectors, work_positions |
| 4 | `add_annual_plans` | annual_plans, plan_tasks |
| 5 | `add_enhanced_events` | Columnas adicionales en events (status, assigned_to, recurrence) |
| 6 | `add_visit_records` | visits, visit_observations |
| 7 | `add_checklists_protocols_observations` | checklists, checklist_items, templates, measurement_protocols, measurement_points, observations |
| 8 | `add_normativa_seed_data` | normativa_iluminacion (24 rows), normativa_ruido (10 rows), checklist_templates (3), items (95) |
| 9 | `fix_profiles_rls_infinite_recursion` | Funcion `get_user_organization_id()` + nuevas RLS policies |
| 10 | `add_risk_assessments` | risk_assessments, hazards |
| 11 | `add_incidents` | incidents, incident_causes, incident_casualties |
| 12 | `create_storage_buckets` | 5 storage buckets + RLS policies |

### Funcion de seguridad critica

```sql
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;
```

> **IMPORTANTE:** Todas las politicas RLS deben usar esta funcion en lugar de subqueries directas a `profiles` para evitar recursion infinita.

### Normativa precargada

- **normativa_iluminacion**: 24 registros con niveles minimos de lux por tipo de actividad (Decreto 351/79, Anexo IV)
- **normativa_ruido**: 10 registros con limites de dB por duracion de exposicion
- **checklist_templates**: 3 plantillas con 95 items de verificacion predefinidos

---

## 13. Patrones y Convenciones

### Codigo

- **Todo el texto de interfaz en espanol** (argentino)
- **Dark mode obligatorio**: usar clases `dark:` de Tailwind en todos los componentes
- **Responsive**: minimo 375px de ancho (mobile-first)
- **Errores con detalle**: siempre incluir `error.message` en los toasts, nunca mensajes genericos
- **Patron defensivo de loading**: llamar `setLoading(false)` en TODOS los caminos de retorno

### Componentes

- Usar componentes de shadcn/ui siempre que sea posible
- `Topbar` solo acepta `title` y `description` (sin children)
- Badges con colores de los mapas de constantes
- Cards con `rounded-xl border border-border bg-card shadow-sm`

### Supabase

- Client browser: `createClient()` de `@/lib/supabase/client`
- Client SSR: `createClient()` de `@/lib/supabase/server`
- Todas las queries filtran por `organization_id`
- Instalar paquetes: siempre usar `npm install --legacy-peer-deps`

### Organizacion de tipos

- Tipos de entidades CRM: `lib/crm-types.ts`
- Tipos del estudio de carga de fuego: `lib/types.ts`
- Mapas de constantes con `{ label: string; color: string }` (mayoria) o `string` (algunas)

---

## 14. Resolucion de Problemas

### Loading infinito en paginas

**Causa:** La funcion de carga no llama a `setLoading(false)` cuando `profile?.organization_id` es undefined.

**Solucion:**
```tsx
if (!profile?.organization_id) {
  setLoading(false)  // ← SIEMPRE agregar esto
  return
}
```

### Error: RLS recursion infinita

**Causa:** Politica RLS en `profiles` que hace subquery a `profiles`.

**Solucion:** Usar `public.get_user_organization_id()` en todas las politicas.

### Error: `npm install` falla por peer dependencies

**Solucion:** Usar `npm install --legacy-peer-deps`

### Error: `@react-pdf/renderer` no acepta `false` en style arrays

**Causa:** Las expresiones condicionales `condicion && estilo` producen `false | Style`.

**Solucion:** Crear funciones helper que filtren los valores falsy:
```tsx
function buildStyle(...styles: (Style | false | undefined)[]): Style[] {
  return styles.filter(Boolean) as Style[]
}
```

### Error: Mapas de constantes usados como ReactNode

**Causa:** `REPORT_TYPES[tipo]` retorna `{label, color}`, no un string.

**Solucion:** Acceder a `.label`: `REPORT_TYPES[tipo]?.label`

### Error: `DocumentProps` en use-pdf-generator

**Causa:** `pdf()` espera `ReactElement<DocumentProps>`.

**Solucion:** Importar `DocumentProps` de `@react-pdf/renderer` y tipar el parametro:
```tsx
import type { DocumentProps } from "@react-pdf/renderer"
```

---

## 15. Proximos Pasos (Fase 5)

### Fase 5: AI, Automatizacion y Polish

| Tarea | Descripcion | Prioridad |
|-------|-------------|-----------|
| 5.1 Sistema de notificaciones | Alertas de vencimientos, calibraciones, tareas | Alta |
| 5.2 Asistente AI para informes | Autocompletado inteligente con AI | Media |
| 5.3 Smart defaults | Relleno automatico basado en datos historicos | Media |
| 5.4 Colaboracion en tiempo real | Supabase Realtime para edicion simultanea | Baja |
| 5.5 Busqueda global | Command palette (Ctrl+K) para buscar en todo el sistema | Alta |
| 5.6 Polish mobile | Optimizar UX en dispositivos moviles | Alta |
| 5.7 Onboarding | Wizard de bienvenida para nuevos usuarios | Media |
| 5.8 Optimizacion de performance | Code splitting, lazy loading, prefetching | Media |

### Mejoras de seguridad pendientes

- Habilitar proteccion contra passwords filtradas (HaveIBeenPwned) en Supabase Auth
- Agregar `SET search_path = public` a las funciones `instrument_has_valid_calibration` y `handle_new_profile`
- Considerar habilitar RLS en `normativa_iluminacion` y `normativa_ruido` (son tablas de referencia)

---

## Apendice A: Variables de Entorno

| Variable | Descripcion | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase | Si |

## Apendice B: Comandos Utiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor de desarrollo
npm run build                  # Build de produccion
npm run lint                   # Ejecutar linter

# Componentes
npx shadcn@latest add badge    # Agregar componente shadcn/ui

# Dependencias (SIEMPRE con legacy-peer-deps)
npm install paquete --legacy-peer-deps
```

## Apendice C: Normativa Argentina Implementada

| Normativa | Modulo | Implementacion |
|-----------|--------|----------------|
| Ley 19.587 | General | Base legal del sistema |
| Decreto 351/79 | Carga de Fuego | Calculos, resistencia al fuego, extintores |
| Decreto 351/79 Anexo IV | Iluminacion | Tabla de niveles minimos (24 actividades) |
| Res. SRT 84/12 | Protocolo Iluminacion | Formato oficial de medicion |
| Res. SRT 85/12 | Protocolo Ruido | Formato oficial de medicion |
| Res. SRT (PAT) | Protocolo PAT | Formato de medicion de puesta a tierra |

---

*Documento generado el 6 de marzo de 2026 — CRM-SH v1.0 (Fases 1-4)*

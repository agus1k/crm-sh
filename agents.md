# CRM-SH - Agent Context & Workflow

## Project Overview

**CRM-SH** is a CRM SaaS for Safety & Hygiene (Seguridad e Higiene) professionals in Argentina. It manages clients, projects, technical reports (fire load studies per Decreto 351/79 - Ley 19.587), and calendar events.

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: React 19, TypeScript 5.7, Tailwind CSS 3.4, shadcn/ui (default style, neutral base)
- **State**: Zustand 5 (auth-store, app-store)
- **Backend**: Supabase (Auth, PostgreSQL, SSR middleware)
- **Forms**: react-hook-form + zod
- **Charts**: recharts 2.15
- **Icons**: lucide-react
- **Fonts**: Inter (sans), JetBrains Mono (mono)

### Architecture
```
app/
  (auth)/          # Login, Register (public routes)
  (dashboard)/     # Protected routes (AuthGuard + Sidebar layout)
    page.tsx       # Dashboard home (stats, recent reports, events)
    clientes/      # Client management
    proyectos/     # Project management
    informes/      # Reports (CRUD + multi-step fire load wizard)
      nuevo/carga-de-fuego/  # Fire load study wizard
    agenda/        # Calendar events
    configuracion/ # Settings
components/
  layout/          # sidebar.tsx, topbar.tsx
  steps/           # 8-step fire load study wizard components
  ui/              # shadcn/ui components
lib/
  types.ts         # Fire load study types (FormState, Sector, etc.)
  crm-types.ts     # CRM entity types (Client, Project, Report, etc.)
  calculos.ts      # Fire load calculation engine
  normativa.ts     # Legal normative data (Dec. 351/79)
  store.ts         # Form state defaults, step definitions
  stores/          # Zustand stores (auth-store, app-store)
  supabase/        # Supabase client, server, middleware helpers
  utils.ts         # cn() utility
```

### CRM Data Model (Supabase PostgreSQL)
- **organizations** - Multi-tenant orgs (name, cuit, subscription)
- **profiles** - Users linked to orgs (role: admin/tecnico/cliente, matricula)
- **clients** - Org's clients (razon_social, cuit, contacto)
- **projects** - Client projects (status: activo/completado/archivado)
- **reports** - Technical reports (type: carga_de_fuego/ruido/iluminacion/etc, form_data JSON, status workflow)
- **events** - Calendar events (type: inspeccion/vencimiento/reunion/otro)

### Auth Flow
- Supabase Auth with email/password
- SSR middleware refreshes session tokens
- AuthGuard in dashboard layout loads user -> profile -> organization
- Zustand auth-store persists session state client-side

### Key Business Logic
- Fire load study follows 8 steps: Empresa -> Profesionales -> Sectores -> Materiales -> Extintores -> Evacuacion -> Resultados -> Informe
- Calculations in `lib/calculos.ts` determine fire resistance, extinguisher requirements, evacuation compliance
- Reports are versioned with status workflow: borrador -> en_revision -> completado -> enviado -> vencido

---

## Workflow Rules

### 1. Default to Planning Mode
- Enter planning mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes wrong, STOP and return to planning immediately; do not force through
- Use planning mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- Write the plan in `tasks/todo.md` with verifiable items

### 2. Sub-Agent Strategy
- Use sub-agents frequently to keep the main context window clean
- Delegate research, exploration, and parallel analysis to sub-agents
- For complex problems, dedicate more compute via sub-agents
- One task per sub-agent for focused execution

### 3. Self-Improvement Loop
- After ANY user correction: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Iterate relentlessly on these lessons until error rate decreases
- Review lessons at session start for the corresponding project

### 4. Verification Before Completion
- Never mark a task as completed without demonstrating it works
- Compare diff of behavior between main branch and your changes when relevant
- Ask yourself: "Would a Staff Engineer approve this?"
- Run tests, check logs, and demonstrate code correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix seems hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes; don't over-engineer
- Question your own work before presenting it

### 6. Autonomous Bug Fixing
- When receiving a bug report: just fix it. Don't ask to be hand-held
- Identify logs, errors, or failing tests then resolve them
- Zero context-switching needed from the user
- Go fix failing CI tests without being told how

### 7. Task Management Protocol
1. **Plan First**: Write plan in `tasks/todo.md` with verifiable items
2. **Verify Plan**: Confirm before starting implementation
3. **Track Progress**: Mark items as completed as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add a review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

### 8. Core Principles
- **Simplicity First**: Make each change as simple as possible. Affect minimal code
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs
- **Spanish UI**: All user-facing text in Spanish (Argentine locale)
- **Supabase-first**: Use Supabase client for all data operations, respect RLS policies

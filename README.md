# sandbox-utah

Plataforma legal-tech bilingüe (es-US / en-US) para residentes de Utah, operando bajo el [Utah Legal Regulatory Sandbox Phase 2](https://utahinnovationoffice.org/sandbox-phase-2/). Ayuda a llenar y radicar formularios oficiales de Utah Courts (divorcio sin disputa, defensa de desalojo, cambio de nombre, custodia, small claims, LLC, etc.). **No es un bufete de abogados ni proporciona asesoría legal.**

## Stack

- **Next.js 16** (App Router, webpack, typedRoutes, server actions)
- **React 19** + TypeScript estricto (`exactOptionalPropertyTypes`, `verbatimModuleSyntax`)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **next-intl** para i18n (es-US default, en-US alterno)
- **Tailwind 4** + shadcn/ui
- **Gemini 2.5** (Flash + Pro) con guardrails de 6 capas
- **pdf-lib** para generación de paquetes oficiales
- **Vitest** (unit) + **Playwright** (e2e)
- **Biome** (lint + format)
- **PWA** vía serwist (`@serwist/next`)

## Features principales

| Módulo | Descripción |
|---|---|
| Onboarding 5 pasos | Datos personales, ID verification (driver license OCR vía Gemini Pro), consents bilingües |
| Catálogo bilingüe | 12 servicios en 3 categorías (Familia, Vivienda, Empresarial) |
| Workflow engine | State machine declarativa: divorce, eviction-defense, llc-formation, small-claims |
| Casos & wizards | Multi-step forms con validación Zod, guarda automático en `cases.form_data` |
| Pagos manuales | Cash/Zelle/cheque/money-order, verificación admin |
| Contratos | Dropbox Sign (stub en dev) |
| AI Assistant | Gemini Flash con 5 capas de guardrails (NO inmigración, NO asesoría) |
| **Radicación por Distrito** | 8 distritos × 29 condados, packet PDF server-side, audit log inmutable |
| Complaints sandbox | UPL disclaimer + complaints CTA prominentes (sandbox phase 2) |
| Admin shell | Dashboard, identity queue, complaints, compliance, catalog |

## Scripts

```bash
pnpm dev              # next dev --webpack
pnpm build            # next build
pnpm typecheck        # tsc --noEmit
pnpm lint             # biome check .
pnpm lint:fix         # biome check --write
pnpm test             # vitest run
pnpm test:e2e         # playwright test
pnpm db:gen-types     # supabase gen types typescript --local
```

## Setup local

```bash
pnpm install
cp .env.local.example .env.local        # rellenar con keys reales
pnpm db:start                            # supabase local
pnpm db:reset                            # aplica migraciones + seed
pnpm db:gen-types
pnpm dev
```

## Compliance

- Operación bajo Utah Legal Regulatory Sandbox Phase 2 (vigencia 14 ago 2027).
- NO inmigración (orden Utah Supreme Court 16 sept 2024).
- Audit log append-only (`audit_log` + `case_activities` + `filing_packet_prints` con rules `no_update`/`no_delete`).
- RLS por dueño + role admin en todas las tablas con PII.
- UPL disclaimers en cover sheet PDF y banners de UI.
- Reportar quejas: <https://utahinnovationoffice.org/sandbox-customer-complaint/>

Documentación completa: [`ARQUITECTURA.md`](./ARQUITECTURA.md), [`REQUERIMIENTOS.md`](./REQUERIMIENTOS.md), `docs/adr/`.

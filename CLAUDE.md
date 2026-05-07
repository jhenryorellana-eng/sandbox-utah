# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`README.md` cubre el stack y setup. `ARQUITECTURA.md` (1800+ líneas) tiene el detalle completo del diseño. Esto sólo agrega lo que un agente necesita para ser productivo y no repetir errores ya documentados.

## Comandos

```bash
pnpm dev                    # webpack dev server (NO turbopack — typedRoutes lo requiere)
pnpm build                  # next build --webpack
pnpm typecheck              # tsc --noEmit (strict + exactOptionalPropertyTypes + verbatimModuleSyntax)
pnpm lint                   # biome check .
pnpm lint:fix               # biome check --write . (suprime warnings con biome-ignore comments cuando aplique)
pnpm test                   # vitest run (todos los tests)
pnpm test path/to/file      # un solo archivo de test (ej. pnpm test tests/unit/forms/registry.test.ts)
pnpm test -t "nombre"       # filtra por nombre de test/describe
pnpm test:watch             # vitest --watch
pnpm test:e2e               # playwright test
pnpm verify:rls             # scripts/verify-rls.ts — confirma policies en supabase/migrations
pnpm verify:server-imports  # scripts/verify-server-imports.ts — detecta imports server-only en código cliente
```

**Tests deben pasar verdes antes de cada PR.** No esperes que el agente los corra autom; córrelos cuando termines un cambio sustancial.

## Stack overrides vs training data

- **Next.js 16** con webpack (NO turbopack), `app/` router, server actions, `typedRoutes: true`, `--experimental serverActions`. Algunos APIs difieren de Next 13/14/15. Usa `after()` de `next/server` para tareas async post-respuesta (no esperes job queue).
- **React 19** con `babel-plugin-react-compiler`. Sin `useMemo`/`useCallback` en la mayoría de casos (el compiler los inyecta).
- **Zod 4**: `z.object({...}).shape` es propiedad directa, no función. `_def.type` reemplaza a `_def.typeName` (la API anterior aún funciona en algunos casos pero no asumir). Helpers para introspección de schemas viven en `src/features/forms/actions/fetch-bundle.ts`.
- **TypeScript strict + `exactOptionalPropertyTypes: true`**: `field?: string` NO acepta `undefined` explícito. Usa `field?: string | undefined` o asignación condicional (`if (x) result.x = x`).
- **Tailwind 4** con tokens CSS custom (`--color-ulp-*` en `src/app/[locale]/(client)/_components/tokens.css` cuando aplica).
- **Biome 2** reemplaza ESLint+Prettier. Para suprimir reglas usar `// biome-ignore lint/<rule>: <reason>` en la línea inmediatamente anterior a la violación.

## Arquitectura — punteros

```
src/app/[locale]/
  (auth)/login,register,verify-email
  (client)/dashboard, onboarding, cases/[id]/{,wizard,contract,payments,filing,documents,forms,review,finalize}
  admin/{catalog,cases/[id],clients/[id],payments,identity-verifications,complaints,compliance}
src/app/api/
  cases/[id]/filing/(print|), webhooks/dropbox-sign, documents/[id]/signed-url, admin/forms/[code]/refresh
src/features/<feature>/
  actions/*.ts                # "use server" actions con Zod + withCompliance + revalidatePath
  components/*.tsx            # "use client" o server components
  repository.ts               # data access (server-only)
src/server/
  compliance/                 # withCompliance wrapper, audit-log, ComplianceError
  integrations/gemini/        # client REST (no SDK), guardrails, extract-documents, extraction-schemas/
  legal/utah-courts/          # county-mapper, address-resolver, packet-builder, forms/<service>/<form>/{schema,prefill,fill}
  legal/pdf/                  # cover-sheet, packet-merger, pdf-stamper (UPL disclaimer)
  workflows/                  # state machine declarativa por servicio (divorce, eviction, llc)
src/shared/
  domain/money.ts             # Money value object inmutable (cents only)
  types/database.ts           # MANUAL — NO regenerar (ver gotcha abajo)
src/lib/
  supabase/{server,client,middleware}.ts   # createServerClient + createServiceClient
  i18n/{routing,navigation,request}.ts     # next-intl
supabase/migrations/          # SQL aditivos, orden timestamps YYYYMMDDNNNNNN
messages/{es,en}.json         # i18n strings; tests/unit/catalog/messages.test.ts valida cobertura
```

## Convenciones obligatorias

### Server actions

```ts
"use server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const inputSchema = z.object({ /* ... */ })

export interface MyActionResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "..." | "generic"
  errorMessage?: string
}

export async function myAction(input: unknown): Promise<MyActionResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()         // RLS-aware (cookie-based auth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  return withCompliance(
    { action: "X.Y", resourceType: "table_name", userId: user.id, metadata: {...} },
    async () => {
      const service = createServiceClient()           // bypass RLS (server-only)
      // ... mutaciones
      revalidatePath(`/[locale]/...`, "page")
      return { ok: true }
    },
  )
}
```

- **NUNCA `throw`** en actions. Retorna `{ ok: false, errorCode }`.
- Validación SIEMPRE con `safeParse`.
- `withCompliance` envuelve toda mutación crítica → audit log automático.
- `createServerClient()` para lectura cliente-aware. `createServiceClient()` solo cuando el server tiene autoridad (ej. avanzar `intake_status`, escribir append-only tables).

### Append-only tables

`audit_log`, `case_activities`, `ai_interactions`, `filing_packet_prints` tienen reglas SQL `no_update`/`no_delete`. INSERT solo via `createServiceClient()`. NO intentes UPDATE — falla silenciosamente vía `do instead nothing`.

### State machine `intake_status`

Centralizada en `src/features/cases/state-machine.ts`. Antes de `cases.update({ intake_status })`, valida con `canTransition({ from, to, role })` o usa `assertTransition()`.

### Money

`src/shared/domain/money.ts`. Todo dinero en centavos (int). NUNCA manipules ints crudos para precios — usa `Money.fromCents()`/`fromDollars()`/`format(locale)`.

### `src/shared/types/database.ts` es MANUAL

**No regenerar con `pnpm db:gen-types` ni con `mcp__plugin_supabase_supabase__generate_typescript_types`.** El archivo tiene tipos custom (`IntakeStatus`, `FilingFormSnapshot`, `FilingStep`, `FilingResolvedFrom`, `IntakeChannel`, `AiTaskType`, `ExtractionStatus`, `DocumentSlotKind`, `FormResponseStatus`, etc.) que la regeneración borra. Cuando agregues una migración, edita manualmente las tablas afectadas + agrega tablas nuevas + tipos custom al final del archivo de constantes.

## Cómo extender el sistema (playbooks)

### Agregar un servicio nuevo al catálogo

Solo via UI admin (`/admin/catalog`). Si requiere tiers, marca `services.allows_multiple_beneficiaries=true` y agrega filas en `service_tiers`. Los servicios sin tiers usan `services.base_price_cents`.

### Agregar un `document_type` con extracción IA

1. Insert en `document_types` (vía migration o admin) con `extraction_schema_slug = '<slug>'`, `is_per_minor`, `slot_kind`.
2. Crear schema Zod en `src/server/integrations/gemini/extraction-schemas/<slug>.ts`.
3. Registrar en `EXTRACTION_SCHEMAS` map en `extraction-schemas/index.ts` + agregar descripción en `EXTRACTION_SCHEMA_DESCRIPTIONS`.
4. Agregar `applicable_services` array si el doc es solo para servicios específicos.

### Agregar un formulario oficial

1. Crear `src/server/legal/utah-courts/forms/<service>/<form-slug>/{schema,prefill,fill}.ts` (+ `template.pdf` si tienes el AcroForm oficial).
2. `schema.ts`: Zod object con `*_FIELD_GROUPS` y `*_FIELD_LABELS` para FormRunner.
3. `prefill.ts`: `async ({ caseId, clientId }) => { values, sources }` — lee profile, case_minors, documents.extracted_data.
4. `fill.ts`: `async (values, label) => Uint8Array` con pdf-lib (use AcroForm si hay template, sino draw text).
5. Registrar en `FORM_REGISTRY` array de `src/server/legal/utah-courts/forms/registry.ts`.
6. Agregar dispatch en `printFormAction` (`src/features/forms/actions/print-form.ts`).

### Agregar una migración

`supabase/migrations/<timestamp>_<name>.sql` con timestamp `YYYYMMDDNNNNNN` posterior al último. Aplica via MCP `apply_migration` al proyecto remoto `pvszblaaztcyajersawq` y mantén el archivo local en sync. Después actualiza `src/shared/types/database.ts` MANUALMENTE.

## Lecciones críticas (no repetir)

- **1 contrato = 1 caso**. NO deduplicar `cases` por `(client_id, service_id)`. Un cliente puede tener N casos del mismo servicio (custodia para distintos hijos, etc.). `register-client`/`createCaseAction` debe ser idempotente sin colapsar casos.
- **React keys compuestas para docs por hijo**: `${type_id}:${minor_id ?? 'general'}`. Sin esto React colapsa items que comparten `type_id`.
- **`documents.minor_label` es snapshot inmutable**. Si el cliente renombra un `case_minor` después de subir, `minor_label` mantiene el nombre del momento del upload. UI muestra el snapshot.
- **Single source of truth** para tipos de documento: tabla `document_types`. NO duplicar en constantes hardcoded.
- **`terms_snapshot` es inmutable post-firma**. Schema versionado v1/v2 en `src/features/contracts/snapshot-schema.ts` con `parseTermsSnapshot()` que normaliza ambas versiones. Usar `buildTermsSnapshotV2()` para nuevas escrituras.
- **`intake_status` permitido en RLS**: las policies de `case_minors` y `form_responses` validan estados específicos (`'created','contract_pending','in_progress','needs_correction'` para minors edit; `'contract_signed','in_progress','needs_correction'` para forms insert). Si agregas mutaciones cliente, asegúrate del estado.

## Compliance no-negotiables

- Audit log append-only en cada acción crítica vía `withCompliance`.
- UPL disclaimer en cover sheet PDF + banners UI (`src/components/sandbox-banner.tsx` y `pdf-stamper`).
- NO inmigración (orden Utah Supreme Court 16 sept 2024). Los guardrails de Gemini (`src/server/integrations/gemini/guardrails.ts`) bloquean inmigración + jailbreaks + asesoría legal.
- Variables de entorno: `GOOGLE_GEMINI_API_KEY` requerida para extracción/chat reales (sin ella, modo stub para dev). Supabase URL + anon + service-role en `.env.local` (excluido del repo).

## Recursos externos

- Supabase project ID remoto: `pvszblaaztcyajersawq`. Usa MCP `plugin_supabase` para queries (`execute_sql`, `apply_migration`, `list_tables`). Es el mismo BD que producción.
- ADRs en `docs/adr/`. Incluyen clean architecture, supabase stack, PWA serwist, role split client/admin.

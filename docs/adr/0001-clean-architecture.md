# ADR-0001: Clean Architecture en 4 capas

- **Status**: Accepted
- **Date**: 2026-05-02
- **Context**: Sprint 1-2 Foundation

## Contexto

Construimos una plataforma legal sandbox con 16 semanas de roadmap, requisitos
de auditabilidad inmutable (Utah Sandbox Phase 2), reutilización futura de
workflows de varios servicios (divorcio, eviction, LLC), y migración eventual a
proveedores alternativos sin reescribir el dominio.

El proyecto antiguo `UsaLatinoPrime` documenta como anti-patrón god components
de >1,200 líneas y god APIs con autenticación + validación + DB en una sola
ruta. Queremos evitarlo desde día 1.

## Decisión

Adoptar Clean Architecture en cuatro capas:

1. **Presentation** (`src/app/**`, `src/components/**`, `src/features/**/components`)
   — UI Next.js (RSC + Server Actions + client components selectivos).
2. **Application** (`src/server/services/**`, `src/features/**/actions/**`)
   — use cases, orquestación de negocio. Aquí vive `withCompliance`.
3. **Domain** (`src/shared/domain/**`, `src/shared/schemas/**`) — entidades
   puras, value objects, zod schemas. Sin side effects, sin imports de Next.js
   ni Supabase.
4. **Infrastructure** (`src/lib/supabase/**`, `src/server/repositories/**`,
   `src/server/integrations/**`) — adapters a Supabase, Gemini, Dropbox Sign,
   Resend, Twilio.

Reglas de cumplimiento:

- `src/server/**` y `src/app/**/route.ts` no pueden importar
  `@/lib/supabase/client` (Biome `noRestrictedImports`).
- Todo módulo en `src/server/**` empieza con `import "server-only"`.
- Domain no importa de application/infrastructure (Dependency Inversion).
- Tests de domain no requieren mocks de Next.js o Supabase.

## Consecuencias

- ✅ Auditoría/cumplimiento aislado: cualquier cambio en compliance es localizado.
- ✅ Tests unitarios puros para domain layer (sin DB, sin HTTP).
- ✅ Migración futura de Supabase a otro DB por capas, no por feature.
- ❌ Más boilerplate al inicio (2-3 archivos por feature en lugar de 1).
- ❌ Aprendizaje requerido para contribuyentes nuevos. Se mitiga con esta ADR
  + estructura ejemplo de `src/features/auth/`.

## Alternativas consideradas

- **Feature-only (vertical slices puro)**: rechazado porque la Court audita
  por procesos transversales (autenticación, audit log) — necesitamos la capa
  horizontal compartida.
- **MVC clásico**: rechazado, no encaja con RSC + Server Actions.

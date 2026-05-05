# ADR-0002: Stack Supabase (Postgres + Auth + Storage + RLS)

- **Status**: Accepted
- **Date**: 2026-05-02

## Contexto

El sandbox audita el manejo de PII, complaint trail, y consentimientos
inmutables. Necesitamos:

1. Postgres relacional con ACID para casos legales.
2. Row Level Security (RLS) para garantías de aislamiento que un audit pueda
   verificar al nivel de DB (no solo del código).
3. Auth, Storage y Realtime sin operar 4 servicios separados.
4. Migración a SQL plano si en el futuro hay que mover.

## Decisión

Adoptar Supabase como stack único: Postgres 16 + Auth + Storage + RLS + Edge
Functions + Realtime. Las migraciones viven en `supabase/migrations/*.sql` —
SQL puro, no DSL — para portabilidad. Los tipos TS se generan con `supabase gen
types` (`pnpm db:gen-types`).

Garantías técnicas en Sprint 1-2:

- Toda tabla `public.*` tiene RLS habilitado (CI gate `verify:rls`).
- `audit_log` y `consents` son append-only via RULES + REVOKE de privilegios.
- El service-role key solo se usa desde `src/server/compliance/audit-log.ts`,
  importado con `import "server-only"`.
- Cookies de auth fluyen vía `@supabase/ssr` con `createServerClient` y
  `createBrowserClient`; nunca se mezclan.

## Consecuencias

- ✅ Auditor del sandbox puede inspeccionar policies SQL directamente.
- ✅ RLS impide bug de aplicación que exponga datos cross-tenant.
- ✅ Generación automática de tipos: cambios de schema rompen typecheck.
- ❌ Vendor lock-in moderado. Mitigado: SQL portable + repositories abstrayendo.
- ❌ Free tier limitado; pasaremos a pago al primer admin con MFA real.

## Alternativas consideradas

- **Firebase**: rechazado por falta de Postgres + RLS visible/auditable.
- **Auth0 + Postgres separado + S3**: 3 servicios = más superficie de auditoría.
- **PlanetScale + Auth.js**: sin RLS nativo nivel DB.

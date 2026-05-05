# Architecture Decision Records

Decisiones arquitecturales documentadas en formato MADR ligero.

## Index

- [ADR-0001](./0001-clean-architecture.md) — Clean Architecture en 4 capas
- [ADR-0002](./0002-supabase-stack.md) — Stack Supabase (Postgres + Auth + Storage + RLS)
- [ADR-0003](./0003-pwa-with-serwist.md) — PWA con @serwist/next y política PII-safe offline
- [ADR-0004](./0004-roles-client-admin.md) — Solo dos roles: client y admin

## Cómo agregar una ADR nueva

1. Copiar el formato de un ADR existente.
2. Numerar secuencialmente: `0005-<slug>.md`.
3. Status inicial: `Proposed`. Cambiar a `Accepted` tras review/aprobación.
4. Actualizar este index.
5. Si reemplaza/modifica una ADR previa, marcarla `Superseded by 000X` y
   apuntar al nuevo en el header.

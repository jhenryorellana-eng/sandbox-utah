# ADR-0004: Solo dos roles: client y admin

- **Status**: Accepted
- **Date**: 2026-05-02

## Contexto

El sandbox Phase 2 (Moderate Innovation) requiere un abogado licenciado en
Utah que supervise QA, plantillas y revisión de casos. La pregunta natural es:
¿modelamos al abogado supervisor como un rol técnico distinto (`lawyer`,
`supervisor`, `qa_reviewer`)?

Más roles = más combinaciones de RLS = más superficie auditable, más casos de
prueba, más riesgo de policy-mistake. El proyecto antiguo `UsaLatinoPrime`
documenta como anti-patrón un RBAC sobre-elaborado que no se reflejaba en la
operación real (todos los staff eran funcionalmente admin).

## Decisión

Sprint 1-2 modela **solo dos roles**: `client` y `admin`.

- El abogado supervisor del sandbox es un `admin` más en `user_roles`.
- Sus revisiones QA se rastrean por `actor_id` en audit log y por
  `qa_reviewed_by` (FK a profile) en tabla `cases` (cuando exista, Sprint 5-6).
- Si se necesita distinguir staff vs supervisor en el futuro, se agrega un
  campo flag `profiles.is_lawyer_supervisor` o se enriquece `user_roles.role`
  con un nuevo valor — sin schema break.

## Consecuencias

- ✅ Matriz de RLS de 2x4 (rol × tabla) verificable a mano por un auditor.
- ✅ Tests de policies cubren toda la combinatoria.
- ✅ Onboarding del primer admin = un INSERT en `user_roles`.
- ❌ Si crece el equipo a >5 admins, perderemos granularidad sin rediseño.
  Aceptable hasta MRR > $50k, donde se justifica revisar.
- ❌ El abogado supervisor con rol `admin` puede modificar configuración de
   negocio. Mitigación: audit log + acuerdo contractual + 4-eyes para acciones
   destructivas (Sprint 7-8).

## Alternativas consideradas

- **Roles `client` / `staff` / `supervisor`**: rechazado, agrega complejidad
   sin beneficio funcional en MVP.
- **Permisos granulares (RBAC clásico)**: rechazado, sobre-ingeniería
   prematura.

import "server-only"

/**
 * Lanzar `ComplianceError` para señalar que una acción fue **bloqueada por
 * compliance** (no es un fallo técnico). El `withCompliance` wrapper la
 * distingue de errores genéricos y la registra en audit_log con `phase='blocked'`.
 *
 * Ejemplos de uso futuro (sprints posteriores):
 *   - filtro de palabras migratorias detecta intento de uso prohibido
 *   - rate limiter excede umbral
 *   - intento de acción cross-tenant
 */
export class ComplianceError extends Error {
  readonly code: string

  constructor(message: string, code = "compliance_blocked") {
    super(message)
    this.name = "ComplianceError"
    this.code = code
  }
}

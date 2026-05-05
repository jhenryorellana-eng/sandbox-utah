/**
 * Error codes con i18n keys para la feature Filing. Las keys mapean a
 * `messages/{es,en}.json -> Filing.errors`.
 */
export type FilingErrorCode =
  | "missing_address"
  | "identity_not_approved"
  | "out_of_state"
  | "city_not_recognized"
  | "invalid_county"
  | "service_not_supported"
  | "case_not_found"
  | "case_status_invalid"
  | "venue_violation"
  | "form_unavailable"
  | "internal_error"
  | "unauthorized"

export class FilingError extends Error {
  readonly code: FilingErrorCode
  readonly context?: Record<string, string | number | null>

  constructor(code: FilingErrorCode, context?: Record<string, string | number | null>) {
    super(code)
    this.name = "FilingError"
    this.code = code
    if (context) this.context = context
  }
}

export function isFilingError(err: unknown): err is FilingError {
  return err instanceof FilingError
}

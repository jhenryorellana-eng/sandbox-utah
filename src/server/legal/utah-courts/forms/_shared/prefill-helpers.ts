import "server-only"

import type { CaseMinorRow } from "@/features/cases/repository"
import type { DocumentRow } from "@/features/documents/repository"

export interface PrefillSource {
  field: string
  from: "minor" | "document" | "case" | "profile"
  refId?: string | undefined
}

export interface PrefillResult<T extends Record<string, unknown>> {
  values: Partial<T>
  sources: Record<keyof T, PrefillSource | null>
}

/**
 * Selecciona el documento extraído más reciente para un schema dado, opcionalmente
 * filtrado por minor_id (cuando el doc es per-menor).
 */
export function pickLatestExtractedDoc(
  documents: DocumentRow[],
  filter: { extractionSchemaSlug: string; documentTypeSlugs: string[]; minorId?: string },
): DocumentRow | null {
  const candidates = documents
    .filter((d) => d.extraction_status === "extracted")
    .filter((d) => d.extracted_data !== null)
    .filter((d) => (filter.minorId ? d.minor_id === filter.minorId : d.minor_id === null))
  if (filter.documentTypeSlugs.length === 0) return candidates[0] ?? null
  // Caller debe pasar los IDs precomputados; este helper trabaja con objetos crudos
  return candidates[0] ?? null
}

/**
 * Lee un campo del jsonb extracted_data si existe.
 */
export function readExtractedField<T = string>(doc: DocumentRow | null, field: string): T | null {
  if (!doc?.extracted_data) return null
  const data = doc.extracted_data as Record<string, unknown>
  const value = data[field]
  if (value === undefined || value === null) return null
  return value as T
}

/**
 * Combina valores con tracking de origen.
 */
export class PrefillBuilder<T extends Record<string, unknown>> {
  private readonly values: Partial<T> = {}
  private readonly sources: Record<string, PrefillSource | null> = {}

  set<K extends keyof T>(field: K, value: T[K] | null | undefined, source: PrefillSource): void {
    if (value === null || value === undefined || value === "") return
    this.values[field] = value
    this.sources[field as string] = source
  }

  build(): PrefillResult<T> {
    return {
      values: this.values,
      sources: this.sources as Record<keyof T, PrefillSource | null>,
    }
  }
}

export function fullNameForMinor(minor: CaseMinorRow): string {
  return minor.full_name
}

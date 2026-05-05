import "server-only"
import { createHash } from "node:crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { checkUrl, isAllowedHost } from "./link-validator"

/**
 * Cache de PDFs oficiales de utcourts.gov.
 *
 * Estrategia:
 *   - Cuando se necesita un formulario para un packet, primero intentamos leer
 *     el PDF cacheado en bucket `generated-pdfs/forms/{form_code}.pdf`.
 *   - Si no existe o el cache es viejo (>30 días), hacemos HEAD para verificar
 *     que el URL siga vivo, descargamos, calculamos SHA-256 y subimos.
 *   - El SHA-256 se persiste en `official_court_forms.cached_sha256` para que
 *     el snapshot del packet pueda verificar integridad después.
 *
 * No descargamos formats != 'pdf' (mypaperwork, html). Para esos, el botón
 * Imprimir abre el deep-link directamente en pestaña nueva; la cache devuelve
 * `kind: 'deep_link'`.
 */

const CACHE_BUCKET = "generated-pdfs"
const CACHE_PREFIX = "forms"
const CACHE_TTL_DAYS = 30
const MAX_PDF_BYTES = 12 * 1024 * 1024 // 12 MB

export type FormCacheResult =
  | { kind: "pdf"; bytes: Uint8Array; sha256: string; storagePath: string; fromCache: boolean }
  | { kind: "deep_link"; url: string; format: "mypaperwork" | "html" | "docx" }
  | { kind: "error"; reason: string; status?: number }

interface FormRow {
  form_code: string
  url_official: string
  format: "pdf" | "docx" | "mypaperwork" | "html"
  cached_storage_path: string | null
  cached_sha256: string | null
  cached_at: string | null
}

async function loadFormRow(formCode: string): Promise<FormRow | null> {
  const service = createServiceClient()
  const { data } = await service
    .from("official_court_forms")
    .select("form_code, url_official, format, cached_storage_path, cached_sha256, cached_at")
    .eq("form_code", formCode)
    .eq("is_active", true)
    .maybeSingle()
  return data as FormRow | null
}

function isStaleCache(cachedAt: string | null): boolean {
  if (!cachedAt) return true
  const cacheTime = Date.parse(cachedAt)
  if (!Number.isFinite(cacheTime)) return true
  const age = Date.now() - cacheTime
  return age > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
}

async function downloadFromBucket(path: string): Promise<Uint8Array | null> {
  const service = createServiceClient()
  const { data } = await service.storage.from(CACHE_BUCKET).download(path)
  if (!data) return null
  const buf = await data.arrayBuffer()
  return new Uint8Array(buf)
}

async function uploadToBucket(path: string, bytes: Uint8Array): Promise<boolean> {
  const service = createServiceClient()
  const { error } = await service.storage.from(CACHE_BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  })
  if (error) {
    console.error("[form-cache] upload failed", path, error.message)
    return false
  }
  return true
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

async function downloadFromUrl(url: string): Promise<Uint8Array | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      console.warn("[form-cache] fetch", url, res.status)
      return null
    }
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.toLowerCase().includes("pdf") && !ct.toLowerCase().includes("octet-stream")) {
      console.warn("[form-cache] non-pdf content-type", url, ct)
      return null
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_PDF_BYTES) {
      console.warn("[form-cache] pdf too large", url, buf.byteLength)
      return null
    }
    return new Uint8Array(buf)
  } catch (err) {
    console.error("[form-cache] download error", url, err instanceof Error ? err.message : err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function refreshFormMetadata(
  formCode: string,
  patch: Partial<{
    cached_storage_path: string
    cached_sha256: string
    cached_at: string
    cache_size_bytes: number
    last_url_check_at: string
    last_url_status: number
  }>,
): Promise<void> {
  const service = createServiceClient()
  const { error } = await service
    .from("official_court_forms")
    .update(patch)
    .eq("form_code", formCode)
  if (error) console.warn("[form-cache] metadata patch failed", formCode, error.message)
}

/**
 * Devuelve los bytes del PDF (cacheado o recién descargado) o un deep-link si
 * el formato no es pdf.
 */
export async function getOrFetchForm(formCode: string): Promise<FormCacheResult> {
  const row = await loadFormRow(formCode)
  if (!row) return { kind: "error", reason: "form_not_found" }

  if (row.format !== "pdf") {
    return { kind: "deep_link", url: row.url_official, format: row.format }
  }

  if (!isAllowedHost(row.url_official)) {
    return { kind: "error", reason: "host_not_allowed" }
  }

  const storagePath = row.cached_storage_path ?? `${CACHE_PREFIX}/${formCode}.pdf`

  // Cache hit válido
  if (row.cached_sha256 && row.cached_storage_path && !isStaleCache(row.cached_at)) {
    const bytes = await downloadFromBucket(row.cached_storage_path)
    if (bytes) {
      return {
        kind: "pdf",
        bytes,
        sha256: row.cached_sha256,
        storagePath: row.cached_storage_path,
        fromCache: true,
      }
    }
  }

  // Cache miss / stale: HEAD + GET
  const head = await checkUrl(row.url_official)
  await refreshFormMetadata(formCode, {
    last_url_check_at: new Date().toISOString(),
    last_url_status: head.status,
  })
  if (!head.ok) {
    return { kind: "error", reason: "url_unreachable", status: head.status }
  }

  const bytes = await downloadFromUrl(row.url_official)
  if (!bytes) return { kind: "error", reason: "download_failed" }

  const sha256 = sha256Hex(bytes)
  const uploaded = await uploadToBucket(storagePath, bytes)
  if (!uploaded) return { kind: "error", reason: "cache_upload_failed" }

  await refreshFormMetadata(formCode, {
    cached_storage_path: storagePath,
    cached_sha256: sha256,
    cached_at: new Date().toISOString(),
    cache_size_bytes: bytes.byteLength,
  })

  return { kind: "pdf", bytes, sha256, storagePath, fromCache: false }
}

/**
 * Forzar refresco (para admin endpoint /api/admin/forms/[formCode]/refresh).
 * Borra cache y re-descarga.
 */
export async function refreshForm(formCode: string): Promise<FormCacheResult> {
  const row = await loadFormRow(formCode)
  if (!row) return { kind: "error", reason: "form_not_found" }
  if (row.format !== "pdf") {
    return { kind: "deep_link", url: row.url_official, format: row.format }
  }
  // Marcamos cache como expirado y delegamos.
  await refreshFormMetadata(formCode, {
    cached_at: new Date(0).toISOString(),
  })
  return getOrFetchForm(formCode)
}

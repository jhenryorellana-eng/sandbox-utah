import "server-only"

/**
 * Validador HEAD para URLs oficiales de utcourts.gov / le.utah.gov / legacy.
 *
 * Se usa para:
 *   1. Verificar que un PDF oficial sigue resolviendo antes de cachearlo.
 *   2. Marcar `last_url_status` en `official_court_forms` para detectar links rotos.
 *
 * NO descarga el cuerpo (HEAD), salvo si el server respondió 405 (algunos
 * servidores rechazan HEAD); en ese caso hace GET con `Range: bytes=0-0` para
 * minimizar transferencia.
 *
 * Whitelist de hosts permitidos para evitar SSRF.
 */

const ALLOWED_HOSTS: ReadonlySet<string> = new Set([
  "www.utcourts.gov",
  "utcourts.gov",
  "legacy.utcourts.gov",
  "le.utah.gov",
  "utahinnovationoffice.org",
  "www.utahinnovationoffice.org",
])

const TIMEOUT_MS = 10_000

export interface LinkCheckResult {
  ok: boolean
  status: number
  contentType: string | null
  contentLength: number | null
  finalUrl: string
  durationMs: number
  error?: string
}

export function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false
    return ALLOWED_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

export async function checkUrl(url: string): Promise<LinkCheckResult> {
  const start = Date.now()
  const failBase = (status: number, error: string): LinkCheckResult => ({
    ok: false,
    status,
    contentType: null,
    contentLength: null,
    finalUrl: url,
    durationMs: Date.now() - start,
    error,
  })

  if (!isAllowedHost(url)) {
    return failBase(0, "host_not_allowed")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    })

    if (response.status === 405 || response.status === 501) {
      // Algunos servidores rechazan HEAD; intentar GET con Range mínimo.
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { Range: "bytes=0-0" },
      })
    }

    const contentLengthHeader = response.headers.get("content-length")
    const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null

    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
      finalUrl: response.url,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return failBase(0, err instanceof Error ? err.message.slice(0, 200) : "unknown")
  } finally {
    clearTimeout(timeout)
  }
}

import "server-only"
import { PDFDocument } from "pdf-lib"

/**
 * Concatena el cover sheet + N PDFs oficiales (utcourts.gov) en un solo packet.
 *
 * Reglas:
 *   - Si un PDF oficial está corrupto o pdf-lib no puede parsearlo, lo omitimos
 *     y registramos el form_code en `errors`. El cover sheet ya lo lista, así
 *     que el cliente sabe qué falta.
 *   - Conservamos el orden del array `parts`. El primero usualmente es el
 *     cover sheet.
 */

export interface PacketPart {
  formCode: string | null
  bytes: Uint8Array
  /** Página índice destino para que packet-stamper sepa qué stampear (no usada aún) */
  isCoverSheet?: boolean
}

export interface MergeResult {
  bytes: Uint8Array
  pageCount: number
  errors: Array<{ formCode: string | null; reason: string }>
}

export async function mergePdfs(parts: PacketPart[]): Promise<MergeResult> {
  const merged = await PDFDocument.create()
  merged.setProducer("usalatinoprimeutah filing module")
  merged.setCreator("usalatinoprimeutah")

  const errors: MergeResult["errors"] = []

  for (const part of parts) {
    try {
      const src = await PDFDocument.load(part.bytes, { ignoreEncryption: true })
      const indices = src.getPageIndices()
      const copied = await merged.copyPages(src, indices)
      for (const page of copied) merged.addPage(page)
    } catch (err) {
      errors.push({
        formCode: part.formCode,
        reason: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      })
    }
  }

  const bytes = await merged.save()
  return { bytes, pageCount: merged.getPageCount(), errors }
}

import "server-only"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

/**
 * Pone watermark UPL en cada página del packet (excepto la cover sheet, que
 * ya lleva el aviso completo).
 *
 * El stamp es ligero (sólo texto en footer) — pdf-lib no soporta imágenes
 * vectoriales nativas y un watermark grande complica la legibilidad de los
 * formularios oficiales.
 */

export interface StampOptions {
  /** Páginas a stampear (0-indexadas). Si no se pasa, todas excepto la 0. */
  pageIndices?: number[]
  /** Texto bilingüe para el footer. */
  footerEs: string
  footerEn: string
  /** Texto del header (caso #) opcional. */
  headerCaseNumber?: string
}

export async function stampPacket(pdfBytes: Uint8Array, opts: StampOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique)

  const total = doc.getPageCount()
  const pages =
    opts.pageIndices ?? Array.from({ length: total }, (_, i) => i).filter((i) => i !== 0)

  for (const idx of pages) {
    const page = doc.getPage(idx)
    const { width } = page.getSize()
    if (opts.headerCaseNumber) {
      page.drawText(opts.headerCaseNumber, {
        x: width - 180,
        y: 20,
        size: 7,
        font: helv,
        color: rgb(0.45, 0.45, 0.45),
      })
    }
    page.drawText(opts.footerEs, {
      x: 24,
      y: 28,
      size: 6.5,
      font: helvOblique,
      color: rgb(0.45, 0.45, 0.45),
    })
    page.drawText(opts.footerEn, {
      x: 24,
      y: 18,
      size: 6.5,
      font: helvOblique,
      color: rgb(0.45, 0.45, 0.45),
    })
    page.drawText(`Página / Page ${idx + 1} / ${total}`, {
      x: width - 90,
      y: 18,
      size: 6.5,
      font: helv,
      color: rgb(0.45, 0.45, 0.45),
    })
  }

  return doc.save()
}

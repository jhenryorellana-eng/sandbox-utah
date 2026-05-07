import "server-only"

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import {
  DEMO_PETITION_FIELD_GROUPS,
  DEMO_PETITION_FIELD_LABELS,
  type DemoPetitionValues,
} from "./schema"

/**
 * Genera un PDF "petición de custodia" demo a partir de los valores capturados.
 * Cuando el cliente provea el PDF oficial del Utah State Courts, esta función
 * se reemplaza por una que use pdfDoc.getForm().getTextField(...).setText(...).
 */
export async function fillDemoPetition(
  values: Partial<DemoPetitionValues>,
  caseLabel: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 612
  const pageHeight = 792
  const margin = 50
  const lineHeight = 14

  let page = doc.addPage([pageWidth, pageHeight])
  let cursorY = pageHeight - margin

  function ensureSpace(needed: number): void {
    if (cursorY - needed < margin) {
      page = doc.addPage([pageWidth, pageHeight])
      cursorY = pageHeight - margin
    }
  }

  page.drawText("STATE OF UTAH — CHILD CUSTODY PETITION (DEMO)", {
    x: margin,
    y: cursorY,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  })
  cursorY -= 18
  page.drawText(`Case: ${caseLabel}`, {
    x: margin,
    y: cursorY,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  })
  cursorY -= 24

  for (const group of DEMO_PETITION_FIELD_GROUPS) {
    ensureSpace(lineHeight * 2)
    page.drawText(group.title_es.toUpperCase(), {
      x: margin,
      y: cursorY,
      size: 11,
      font: helveticaBold,
    })
    cursorY -= lineHeight + 2
    page.drawLine({
      start: { x: margin, y: cursorY + 8 },
      end: { x: pageWidth - margin, y: cursorY + 8 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    })
    cursorY -= 6

    for (const fieldKey of group.fields) {
      const label = DEMO_PETITION_FIELD_LABELS[fieldKey]?.es ?? String(fieldKey)
      const value = values[fieldKey] ?? ""
      const stringValue = typeof value === "string" ? value : String(value ?? "")
      ensureSpace(lineHeight * 2)
      page.drawText(`${label}:`, {
        x: margin,
        y: cursorY,
        size: 9,
        font: helveticaBold,
        color: rgb(0.25, 0.25, 0.25),
      })
      cursorY -= lineHeight
      const wrappedLines = wrapText(stringValue || "(en blanco)", 90)
      for (const line of wrappedLines) {
        ensureSpace(lineHeight)
        page.drawText(line, {
          x: margin + 12,
          y: cursorY,
          size: 10,
          font: helvetica,
        })
        cursorY -= lineHeight
      }
      cursorY -= 4
    }
    cursorY -= 6
  }

  ensureSpace(lineHeight * 4)
  cursorY -= 12
  page.drawText("DEMO ÚNICAMENTE — NO presentar a tribunal hasta validar con un abogado.", {
    x: margin,
    y: cursorY,
    size: 9,
    font: helveticaBold,
    color: rgb(0.7, 0.1, 0.1),
  })

  return await doc.save()
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if (`${current} ${word}`.trim().length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

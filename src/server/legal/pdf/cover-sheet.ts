import "server-only"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { Money } from "@/shared/domain/money"

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 48

export interface CoverSheetData {
  caseNumber: string
  caseDisplayName: string
  clientName: string
  serviceNameEs: string
  serviceNameEn: string
  district: { id: number; nameEs: string; nameEn: string }
  court: {
    nameEs: string
    nameEn: string
    street: string
    city: string
    state: string
    zip: string
    phone: string | null
    hours: string | null
  }
  countyName: string
  intakeFeeCents: number
  feeWaiverFormCode: string | null
  intakeChannelLabelEs: string
  intakeChannelLabelEn: string
  forms: Array<{
    formCode: string
    nameEs: string
    nameEn: string
    isMandatory: boolean
    sha256?: string | null | undefined
  }>
  generatedAt: string
  complaintsUrl: string
  uplDisclaimerEs: string
  uplDisclaimerEn: string
}

/**
 * Helvetica de pdf-lib usa WinAnsi encoding y rechaza cualquier caracter fuera
 * del rango Latin-1 (U+0000..U+00FF). Sustituimos los caracteres más comunes
 * por equivalentes seguros y todo lo demás por '?'. La fuente del rango se
 * expresa en Unicode escapes para evitar bugs de webpack en regex literales.
 */
function sanitizeWinAnsi(input: string): string {
  return input
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[■▪]/g, "[X]")
    .replace(/[□▫]/g, "[ ]")
    .replace(/➜/g, "->")
    .replace(/[  -​　]/g, " ")
    .replace(/[^ -ÿ]/g, "?")
}

export async function renderCoverSheetPdf(data: CoverSheetData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`USA Latino Prime Utah - Cover Sheet ${data.caseNumber}`)
  doc.setAuthor("USA Latino Prime LLC (Utah Sandbox Phase 2)")
  doc.setProducer("usalatinoprimeutah")
  doc.setCreator("usalatinoprimeutah filing module")
  doc.setCreationDate(new Date())

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique)

  let cursorY = PAGE_HEIGHT - MARGIN

  const drawText = (
    text: string,
    x: number,
    y: number,
    opts: { font?: typeof helv; size?: number; color?: ReturnType<typeof rgb> } = {},
  ): void => {
    page.drawText(sanitizeWinAnsi(text), {
      x,
      y,
      size: opts.size ?? 10,
      font: opts.font ?? helv,
      color: opts.color ?? rgb(0, 0, 0),
    })
  }

  const drawRule = (y: number): void => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  drawText("USA LATINO PRIME UTAH", MARGIN, cursorY, { font: helvBold, size: 14 })
  drawText("Paquete oficial de radicacion / Official filing packet", MARGIN, cursorY - 14, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  })
  drawText(`Caso ${data.caseNumber}`, PAGE_WIDTH - MARGIN - 140, cursorY, {
    font: helvBold,
    size: 11,
  })
  drawText(formatDate(data.generatedAt), PAGE_WIDTH - MARGIN - 140, cursorY - 14, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  })
  cursorY -= 32
  drawRule(cursorY)
  cursorY -= 16

  drawText("CASO / CASE", MARGIN, cursorY, { font: helvBold, size: 8, color: rgb(0.3, 0.3, 0.3) })
  cursorY -= 14
  drawText(data.caseDisplayName, MARGIN, cursorY, { font: helvBold, size: 12 })
  cursorY -= 14
  drawText(`Cliente: ${data.clientName}`, MARGIN, cursorY, { size: 10 })
  cursorY -= 12
  drawText(`Servicio (ES): ${data.serviceNameEs}`, MARGIN, cursorY, { size: 10 })
  cursorY -= 12
  drawText(`Service (EN): ${data.serviceNameEn}`, MARGIN, cursorY, { size: 10, font: helvOblique })
  cursorY -= 18
  drawRule(cursorY)
  cursorY -= 16

  drawText("DISTRITO Y CORTE / DISTRICT & COURT", MARGIN, cursorY, {
    font: helvBold,
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  })
  cursorY -= 14
  drawText(`Distrito ${data.district.id}: ${data.district.nameEs}`, MARGIN, cursorY, {
    font: helvBold,
    size: 11,
  })
  cursorY -= 12
  drawText(`District ${data.district.id}: ${data.district.nameEn}`, MARGIN, cursorY, {
    size: 10,
    font: helvOblique,
  })
  cursorY -= 16
  drawText(data.court.nameEs, MARGIN, cursorY, { font: helvBold, size: 11 })
  cursorY -= 12
  drawText(`Condado / County: ${data.countyName}`, MARGIN, cursorY, { size: 10 })
  cursorY -= 12
  drawText(
    `${data.court.street}, ${data.court.city}, ${data.court.state} ${data.court.zip}`,
    MARGIN,
    cursorY,
    { size: 10 },
  )
  cursorY -= 12
  if (data.court.phone) {
    drawText(`Tel: ${data.court.phone}`, MARGIN, cursorY, { size: 10 })
    cursorY -= 12
  }
  if (data.court.hours) {
    drawText(`Horario / Hours: ${data.court.hours}`, MARGIN, cursorY, { size: 10 })
    cursorY -= 12
  }
  cursorY -= 6
  drawRule(cursorY)
  cursorY -= 16

  drawText("FILING FEE", MARGIN, cursorY, {
    font: helvBold,
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  })
  cursorY -= 14
  const feeMoney = Money.fromCents(data.intakeFeeCents)
  drawText(
    `Costo oficial / Official fee: ${feeMoney.format("es")} (${feeMoney.format("en")})`,
    MARGIN,
    cursorY,
    { size: 11, font: helvBold },
  )
  cursorY -= 14
  drawText(
    `Canal de presentacion / Filing channel: ${data.intakeChannelLabelEs} / ${data.intakeChannelLabelEn}`,
    MARGIN,
    cursorY,
    { size: 10 },
  )
  cursorY -= 12
  if (data.feeWaiverFormCode) {
    drawText(
      `Sin recursos? Solicita exencion con el formulario ${data.feeWaiverFormCode} (Motion to Waive Fees).`,
      MARGIN,
      cursorY,
      { size: 9, font: helvOblique, color: rgb(0.3, 0.3, 0.3) },
    )
    cursorY -= 12
  }
  cursorY -= 4
  drawRule(cursorY)
  cursorY -= 16

  drawText("FORMULARIOS INCLUIDOS / INCLUDED FORMS", MARGIN, cursorY, {
    font: helvBold,
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  })
  cursorY -= 14
  if (data.forms.length === 0) {
    drawText("(No forms attached - see referenced links.)", MARGIN, cursorY, {
      size: 9,
      font: helvOblique,
    })
    cursorY -= 12
  } else {
    for (const f of data.forms) {
      const marker = f.isMandatory ? "[X]" : "[ ]"
      const line = `${marker} ${f.formCode} - ${truncate(f.nameEs, 68)}`
      drawText(line, MARGIN, cursorY, { size: 10 })
      cursorY -= 12
      if (cursorY < MARGIN + 180) break
    }
  }
  cursorY -= 6
  drawRule(cursorY)
  cursorY -= 16

  page.drawRectangle({
    x: MARGIN - 4,
    y: cursorY - 78,
    width: PAGE_WIDTH - MARGIN * 2 + 8,
    height: 80,
    color: rgb(1, 0.97, 0.85),
    borderColor: rgb(0.6, 0.45, 0.1),
    borderWidth: 0.7,
  })
  drawText("AVISO IMPORTANTE / IMPORTANT NOTICE", MARGIN, cursorY - 12, {
    font: helvBold,
    size: 9,
    color: rgb(0.4, 0.25, 0),
  })
  drawWrappedText(
    page,
    helv,
    data.uplDisclaimerEs,
    MARGIN,
    cursorY - 26,
    PAGE_WIDTH - MARGIN * 2,
    8.5,
  )
  drawWrappedText(
    page,
    helvOblique,
    data.uplDisclaimerEn,
    MARGIN,
    cursorY - 56,
    PAGE_WIDTH - MARGIN * 2,
    8.5,
  )

  drawText(`Para reportar quejas / Submit complaints: ${data.complaintsUrl}`, MARGIN, MARGIN + 16, {
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  })
  drawText(
    `Generado / Generated: ${formatDate(data.generatedAt)} - USA Latino Prime LLC - Utah Sandbox Phase 2`,
    MARGIN,
    MARGIN,
    { size: 7, font: helvOblique, color: rgb(0.4, 0.4, 0.4) },
  )

  return doc.save()
}

function drawWrappedText(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  size: number,
): void {
  const safe = sanitizeWinAnsi(text)
  const words = safe.split(/\s+/)
  let line = ""
  let y = startY
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    const width = font.widthOfTextAtSize(test, size)
    if (width > maxWidth && line) {
      page.drawText(line, { x, y, size, font, color: rgb(0.2, 0.15, 0.05) })
      y -= size + 2
      line = word
    } else {
      line = test
    }
  }
  if (line) page.drawText(line, { x, y, size, font, color: rgb(0.2, 0.15, 0.05) })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-US", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}...` : s
}

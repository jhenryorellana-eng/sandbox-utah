import "server-only"
import { createHash } from "node:crypto"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance/wrap-with-compliance"
import { renderCoverSheetPdf } from "@/server/legal/pdf/cover-sheet"
import { mergePdfs, type PacketPart } from "@/server/legal/pdf/packet-merger"
import { stampPacket } from "@/server/legal/pdf/pdf-stamper"
import {
  type BuildPacketResult,
  buildPacket,
  getCountyByFips,
  getOrFetchForm,
} from "@/server/legal/utah-courts"
import type { FilingPrintType, Json } from "@/shared/types/database"
import { FilingError } from "../errors"
import type { PrintScope } from "../schemas/packet-schema"

const STORAGE_BUCKET = "generated-pdfs"
const COMPLAINTS_URL = "https://utahinnovationoffice.org/sandbox-customer-complaint/"

const UPL_DISCLAIMER_ES =
  "Esta plataforma NO es un bufete de abogados. NO te brindamos asesoría legal: te ayudamos a llenar y radicar formularios oficiales de Utah Courts que tú revisas y firmas. Operamos bajo el Utah Legal Regulatory Sandbox Phase 2."
const UPL_DISCLAIMER_EN =
  "This platform is NOT a law firm. We do NOT provide legal advice: we help you fill out and file official Utah Courts forms that you review and sign. We operate under the Utah Legal Regulatory Sandbox Phase 2."

const FOOTER_ES =
  "USA Latino Prime Utah · No es un bufete de abogados · Reportar quejas: utahinnovationoffice.org"
const FOOTER_EN =
  "USA Latino Prime Utah · Not a law firm · Report complaints: utahinnovationoffice.org"

const CHANNEL_LABELS_ES: Record<string, string> = {
  in_person: "Presencial",
  mail: "Correo postal",
  email: "Por email",
  mycase: "MyCase (e-filing)",
  efile: "efile.utcourts.gov",
  hybrid: "Múltiples canales",
}
const CHANNEL_LABELS_EN: Record<string, string> = {
  in_person: "In person",
  mail: "Postal mail",
  email: "Email",
  mycase: "MyCase (e-filing)",
  efile: "efile.utcourts.gov",
  hybrid: "Multiple channels",
}

export interface PrintPacketArgs {
  caseId: string
  scope: PrintScope
  formCode: string | null
}

export interface PrintPacketResult {
  filename: string
  bytes: Uint8Array
  sha256: string
  storagePath: string
  contentType: "application/pdf"
}

interface CaseHydrated {
  caseId: string
  caseNumber: string
  displayName: string
  clientName: string
  serviceNameEs: string
  serviceNameEn: string
  clientId: string
}

export async function printFilingPacket(args: PrintPacketArgs): Promise<PrintPacketResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new FilingError("unauthorized")

  return withCompliance(
    {
      userId: user.id,
      action: "filing.packet.print",
      resourceType: "case",
      resourceId: args.caseId,
      piiAccessed: true,
      metadata: { scope: args.scope, form_code: args.formCode },
    },
    async () => {
      const caseInfo = await loadCaseHydrated(args.caseId, user.id)
      if (!caseInfo) throw new FilingError("case_not_found")

      const buildResult = await buildPacket({ caseId: args.caseId })
      if (!buildResult.ok) {
        throw new FilingError("internal_error", { reason: buildResult.error.kind })
      }

      const packet = buildResult.packet

      // Construir PDF según scope
      const pdfBytes = await assemblePdf(args.scope, args.formCode, packet, caseInfo)
      const stampedBytes = await stampPacket(pdfBytes, {
        footerEs: FOOTER_ES,
        footerEn: FOOTER_EN,
        headerCaseNumber: caseInfo.caseNumber,
      })

      // Persistir + audit
      const sha256 = sha256Hex(stampedBytes)
      const filename = buildFilename(args, caseInfo)
      const storagePath = `case-${caseInfo.caseId}/filing/${args.scope}/${filename}`
      const service = createServiceClient()
      const { error: upErr } = await service.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, stampedBytes, {
          contentType: "application/pdf",
          upsert: true,
        })
      if (upErr) throw new FilingError("internal_error", { reason: upErr.message })

      // documents row (idempotente — usamos upsert por storage_path)
      await service.from("documents").insert({
        case_id: caseInfo.caseId,
        client_id: caseInfo.clientId,
        storage_path: storagePath,
        filename,
        mime_type: "application/pdf",
        size_bytes: stampedBytes.byteLength,
        sha256_hash: sha256,
        uploaded_by: user.id,
        is_generated: true,
        is_signed: false,
      })

      // filing_packet_prints row
      const userRole = user.id === caseInfo.clientId ? "client" : "admin"
      const formCodes = collectFormCodesForScope(args.scope, args.formCode, packet)
      await service.from("filing_packet_prints").insert({
        packet_id: packet.packetId,
        case_id: caseInfo.caseId,
        user_id: user.id,
        user_role: userRole,
        print_type: args.scope as FilingPrintType,
        form_codes: formCodes,
        pdf_storage_path: storagePath,
        pdf_sha256: sha256,
        pdf_size_bytes: stampedBytes.byteLength,
      })

      // Actualizar contadores
      await service
        .from("case_filing_packets")
        .update({
          last_printed_at: new Date().toISOString(),
          print_count: (await fetchCurrentPrintCount(packet.packetId)) + 1,
        })
        .eq("id", packet.packetId)

      // case_activities
      await service.from("case_activities").insert({
        case_id: caseInfo.caseId,
        actor_id: user.id,
        actor_type: userRole,
        activity_type: "filing.packet.printed",
        description: `Paquete impreso (${args.scope}, ${formCodes.length} formularios).`,
        metadata: {
          packet_id: packet.packetId,
          scope: args.scope,
          sha256,
          size_bytes: stampedBytes.byteLength,
        } as Json,
      })

      return {
        filename,
        bytes: stampedBytes,
        sha256,
        storagePath,
        contentType: "application/pdf" as const,
      }
    },
  )
}

async function loadCaseHydrated(caseId: string, userId: string): Promise<CaseHydrated | null> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("cases")
    .select(
      "id, case_number, client_id, display_name, service:services(name_es, name_en), client:profiles!cases_client_id_fkey(full_name)",
    )
    .eq("id", caseId)
    .maybeSingle()
  if (error || !data) return null

  const allowed = data.client_id === userId
  if (!allowed) {
    const { data: roleRow } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
    if (!roleRow) return null
  }

  const serviceObj = (data.service ?? {}) as { name_es?: string; name_en?: string }
  const clientObj = (data.client ?? {}) as { full_name?: string | null }

  return {
    caseId: data.id,
    caseNumber: data.case_number,
    displayName: data.display_name,
    clientName: clientObj.full_name ?? "—",
    serviceNameEs: serviceObj.name_es ?? "Servicio",
    serviceNameEn: serviceObj.name_en ?? "Service",
    clientId: data.client_id,
  }
}

async function fetchCurrentPrintCount(packetId: string): Promise<number> {
  const service = createServiceClient()
  const { data } = await service
    .from("case_filing_packets")
    .select("print_count")
    .eq("id", packetId)
    .maybeSingle()
  return data?.print_count ?? 0
}

async function assemblePdf(
  scope: PrintScope,
  formCode: string | null,
  packet: BuildPacketResult,
  caseInfo: CaseHydrated,
): Promise<Uint8Array> {
  const courtRow = await loadCourtForDistrict(packet.districtId, packet.countyFips)
  const districtRow = await loadDistrict(packet.districtId)

  const coverData = {
    caseNumber: caseInfo.caseNumber,
    caseDisplayName: caseInfo.displayName,
    clientName: caseInfo.clientName,
    serviceNameEs: caseInfo.serviceNameEs,
    serviceNameEn: caseInfo.serviceNameEn,
    district: {
      id: packet.districtId,
      nameEs: districtRow?.name_es ?? `Distrito ${packet.districtId}`,
      nameEn: districtRow?.name_en ?? `District ${packet.districtId}`,
    },
    court: {
      nameEs: courtRow?.name_es ?? "Sede del distrito",
      nameEn: courtRow?.name_en ?? "District courthouse",
      street: courtRow?.street ?? "",
      city: courtRow?.city ?? "",
      state: courtRow?.state ?? "UT",
      zip: courtRow?.zip ?? "",
      phone: courtRow?.phone ?? null,
      hours: courtRow?.hours ?? null,
    },
    countyName: getCountyByFips(packet.countyFips)?.name ?? packet.countyName,
    intakeFeeCents: packet.intakeFeeCents,
    feeWaiverFormCode: packet.forms.find((f) => f.form_code === "1301GE")?.form_code ?? null,
    intakeChannelLabelEs: CHANNEL_LABELS_ES[packet.intakeChannel] ?? packet.intakeChannel,
    intakeChannelLabelEn: CHANNEL_LABELS_EN[packet.intakeChannel] ?? packet.intakeChannel,
    forms: packet.forms.map((f) => ({
      formCode: f.form_code,
      nameEs: f.name_es,
      nameEn: f.name_en,
      isMandatory: f.is_mandatory,
      sha256: f.cached_sha256,
    })),
    generatedAt: packet.generatedAt,
    complaintsUrl: COMPLAINTS_URL,
    uplDisclaimerEs: UPL_DISCLAIMER_ES,
    uplDisclaimerEn: UPL_DISCLAIMER_EN,
  }

  const coverPdf = await renderCoverSheetPdf(coverData)

  if (scope === "cover_sheet") {
    return coverPdf
  }

  const formsToInclude = filterFormsForScope(scope, formCode, packet)
  const formParts: PacketPart[] = []
  for (const form of formsToInclude) {
    if (form.format !== "pdf") continue
    const cached = await getOrFetchForm(form.form_code)
    if (cached.kind !== "pdf") continue
    formParts.push({ formCode: form.form_code, bytes: cached.bytes })
  }

  const merged = await mergePdfs([
    { formCode: null, bytes: coverPdf, isCoverSheet: true },
    ...formParts,
  ])
  return merged.bytes
}

function filterFormsForScope(
  scope: PrintScope,
  formCode: string | null,
  packet: BuildPacketResult,
): BuildPacketResult["forms"] {
  if (scope === "single_form" && formCode) {
    return packet.forms.filter((f) => f.form_code === formCode)
  }
  if (scope === "intake_only") {
    // Forms con ordering < 50 son típicamente intake (cover sheets, complaint, summons).
    return packet.forms.filter((f) => f.ordering < 50)
  }
  if (scope === "case_only") {
    return packet.forms.filter((f) => f.ordering >= 50)
  }
  return packet.forms
}

function collectFormCodesForScope(
  scope: PrintScope,
  formCode: string | null,
  packet: BuildPacketResult,
): string[] {
  if (scope === "cover_sheet") return []
  return filterFormsForScope(scope, formCode, packet).map((f) => f.form_code)
}

function buildFilename(args: PrintPacketArgs, caseInfo: CaseHydrated): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const base = `${caseInfo.caseNumber}-${args.scope}`
  const suffix = args.formCode ? `-${args.formCode}` : ""
  return `${base}${suffix}-${ts}.pdf`
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

async function loadCourtForDistrict(
  districtId: number,
  countyFips: string,
): Promise<{
  name_es: string
  name_en: string
  street: string
  city: string
  state: string
  zip: string
  phone: string | null
  hours: string | null
} | null> {
  const service = createServiceClient()
  // Preferir la corte en el condado del cliente; sino la sede principal del distrito.
  const { data: byCounty } = await service
    .from("court_locations")
    .select("name_es, name_en, street, city, state, zip, phone, hours")
    .eq("district_id", districtId)
    .eq("county_fips", countyFips)
    .eq("court_type", "district")
    .eq("is_active", true)
    .maybeSingle()
  if (byCounty) return byCounty

  const { data: byDistrict } = await service
    .from("court_locations")
    .select("name_es, name_en, street, city, state, zip, phone, hours")
    .eq("district_id", districtId)
    .eq("court_type", "district")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()
  return byDistrict
}

async function loadDistrict(
  districtId: number,
): Promise<{ name_es: string; name_en: string } | null> {
  const service = createServiceClient()
  const { data } = await service
    .from("judicial_districts")
    .select("name_es, name_en")
    .eq("id", districtId)
    .maybeSingle()
  return data
}

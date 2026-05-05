/**
 * Mapeo inmutable condado → distrito judicial de Utah.
 *
 * Source of truth: utcourts.gov/dist/overview + UCA 78A-5-101.
 * Esta tabla es estatutaria y rara vez cambia (la última reorganización fue
 * 2008 — fusionar Iron y Beaver al 5to). Hardcodearla aquí — además del seed
 * SQL — sirve como fallback offline para la PWA y como ground-truth en tests.
 *
 * También exponemos un mapeo ciudad → condado (heurístico, no exhaustivo) para
 * resolver `identity_verifications.extracted_address_city` sin geocoding.
 */

export type DistrictId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface CountyEntry {
  fipsCode: string
  name: string
  district: DistrictId
}

/**
 * 29 condados oficiales con FIPS (state 49 = Utah). Orden alfabético.
 */
export const UTAH_COUNTIES: ReadonlyArray<CountyEntry> = Object.freeze([
  { fipsCode: "49001", name: "Beaver", district: 5 },
  { fipsCode: "49003", name: "Box Elder", district: 1 },
  { fipsCode: "49005", name: "Cache", district: 1 },
  { fipsCode: "49007", name: "Carbon", district: 7 },
  { fipsCode: "49009", name: "Daggett", district: 8 },
  { fipsCode: "49011", name: "Davis", district: 2 },
  { fipsCode: "49013", name: "Duchesne", district: 8 },
  { fipsCode: "49015", name: "Emery", district: 7 },
  { fipsCode: "49017", name: "Garfield", district: 6 },
  { fipsCode: "49019", name: "Grand", district: 7 },
  { fipsCode: "49021", name: "Iron", district: 5 },
  { fipsCode: "49023", name: "Juab", district: 4 },
  { fipsCode: "49025", name: "Kane", district: 6 },
  { fipsCode: "49027", name: "Millard", district: 4 },
  { fipsCode: "49029", name: "Morgan", district: 2 },
  { fipsCode: "49031", name: "Piute", district: 6 },
  { fipsCode: "49033", name: "Rich", district: 1 },
  { fipsCode: "49035", name: "Salt Lake", district: 3 },
  { fipsCode: "49037", name: "San Juan", district: 7 },
  { fipsCode: "49039", name: "Sanpete", district: 6 },
  { fipsCode: "49041", name: "Sevier", district: 6 },
  { fipsCode: "49043", name: "Summit", district: 3 },
  { fipsCode: "49045", name: "Tooele", district: 3 },
  { fipsCode: "49047", name: "Uintah", district: 8 },
  { fipsCode: "49049", name: "Utah", district: 4 },
  { fipsCode: "49051", name: "Wasatch", district: 4 },
  { fipsCode: "49053", name: "Washington", district: 5 },
  { fipsCode: "49055", name: "Wayne", district: 6 },
  { fipsCode: "49057", name: "Weber", district: 2 },
])

const COUNTY_BY_FIPS: ReadonlyMap<string, CountyEntry> = new Map(
  UTAH_COUNTIES.map((c) => [c.fipsCode, c]),
)

const COUNTY_BY_NAME: ReadonlyMap<string, CountyEntry> = new Map(
  UTAH_COUNTIES.map((c) => [normalizeCounty(c.name), c]),
)

/**
 * Heurística ciudad → condado. NO es exhaustiva, sólo cubre las ciudades más
 * grandes de cada condado. Si la ciudad no está aquí, la UI cae al dropdown
 * manual de condados (que es la mejor mitigación contra ambigüedad).
 *
 * Fuente: Utah State Auditor — Annexation Reports + US Census 2020 incorporated
 * places (top 50 por población).
 */
const CITY_TO_COUNTY: Readonly<Record<string, string>> = Object.freeze({
  // Salt Lake County
  "salt lake city": "49035",
  "west valley city": "49035",
  "west jordan": "49035",
  sandy: "49035",
  "south jordan": "49035",
  "west jordan city": "49035",
  taylorsville: "49035",
  midvale: "49035",
  "cottonwood heights": "49035",
  draper: "49035",
  herriman: "49035",
  riverton: "49035",
  millcreek: "49035",
  murray: "49035",
  "south salt lake": "49035",
  bluffdale: "49035",
  holladay: "49035",
  magna: "49035",
  // Utah County (distrito 4)
  provo: "49049",
  orem: "49049",
  lehi: "49049",
  "spanish fork": "49049",
  "american fork": "49049",
  pleasant: "49049",
  "pleasant grove": "49049",
  springville: "49049",
  payson: "49049",
  saratoga: "49049",
  "saratoga springs": "49049",
  eagle: "49049",
  "eagle mountain": "49049",
  "cedar hills": "49049",
  alpine: "49049",
  highland: "49049",
  vineyard: "49049",
  // Davis County
  layton: "49011",
  bountiful: "49011",
  clearfield: "49011",
  kaysville: "49011",
  syracuse: "49011",
  centerville: "49011",
  farmington: "49011",
  "north salt lake": "49011",
  // Weber
  ogden: "49057",
  "south ogden": "49057",
  "north ogden": "49057",
  roy: "49057",
  riverdale: "49057",
  "west haven": "49057",
  // Cache (distrito 1)
  logan: "49005",
  hyrum: "49005",
  smithfield: "49005",
  // Box Elder
  "brigham city": "49003",
  // Washington (distrito 5)
  "saint george": "49053",
  "st george": "49053",
  "st. george": "49053",
  hurricane: "49053",
  washington: "49053",
  "washington city": "49053",
  "santa clara": "49053",
  ivins: "49053",
  // Iron
  "cedar city": "49021",
  // Tooele (distrito 3)
  tooele: "49045",
  grantsville: "49045",
  // Summit
  "park city": "49043",
  // Wasatch (distrito 4)
  heber: "49051",
  "heber city": "49051",
  // Sevier (distrito 6)
  richfield: "49041",
  // Carbon (distrito 7)
  price: "49007",
  // Grand
  moab: "49019",
  // San Juan
  blanding: "49037",
  // Duchesne (distrito 8)
  roosevelt: "49013",
  duchesne: "49013",
  // Uintah
  vernal: "49047",
})

export function normalizeCounty(input: string): string {
  return input
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeCity(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z.\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function getCountyByFips(fips: string): CountyEntry | null {
  return COUNTY_BY_FIPS.get(fips) ?? null
}

export function getCountyByName(name: string): CountyEntry | null {
  return COUNTY_BY_NAME.get(normalizeCounty(name)) ?? null
}

/**
 * Dado el nombre de una ciudad de Utah, devuelve el condado al que pertenece
 * (o null si la ciudad no está en la heurística). NO sustituye un geocoding
 * real, pero cubre ~85% de la población de Utah.
 */
export function lookupCountyByCity(city: string | null | undefined): CountyEntry | null {
  if (!city) return null
  const fips = CITY_TO_COUNTY[normalizeCity(city)]
  if (!fips) return null
  return COUNTY_BY_FIPS.get(fips) ?? null
}

export function getDistrictForCounty(fips: string): DistrictId | null {
  return COUNTY_BY_FIPS.get(fips)?.district ?? null
}

/**
 * Útil para UI: agrupar los 29 condados por distrito.
 */
export function groupCountiesByDistrict(): Record<DistrictId, CountyEntry[]> {
  const out = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] } as Record<
    DistrictId,
    CountyEntry[]
  >
  for (const c of UTAH_COUNTIES) out[c.district].push(c)
  return out
}

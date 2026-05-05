import "server-only"

/**
 * Guardrails multi-capa para Gemini (REQUERIMIENTOS §11.4).
 *
 * Capa 1 (este archivo): Filtro regex de keywords prohibidas.
 *  - Inmigración: bloqueo absoluto por orden 16 sept 2024.
 *  - Asesoría: detección de preguntas que piden opinión legal.
 *
 * Capas 2-5: en chat-action.ts (system prompt, safety settings, output classifier, audit log).
 */

const IMMIGRATION_PATTERNS = [
  /\bvisa(s|do)?\b/i,
  /\bgreen[\s-]?card\b/i,
  /\buscis\b/i,
  /\bdacaa?\b/i,
  /\btps\b/i,
  /\bicee?\b/i,
  /\b(asilo|asylum)\b/i,
  /\b(deportaci[oó]n|deportation)\b/i,
  /\b(ciudadan[íi]a|ciudadan[oa]s?|citizenship|citizen|naturalization|naturalizaci[oó]n)\b/i,
  /\b(consulado|consulate|embajada|embassy)\b/i,
  /\bi-?\s?\d{3,4}\b/i, // I-485, I-130, etc.
  /\b(refugiado|refugee)\b/i,
  /\bresidencia (permanente|legal|condicional)\b/i,
  /\b(permanent|legal)\s+residen(cy|t)\b/i,
  /\bremoval proceedings?\b/i,
  /\binmigraci[óo]n|immigration\b/i,
]

const ADVICE_PATTERNS = [
  /\b(deber[íi]a|should|debo|must|tengo que)\s+(yo|i|me)?\s*(pedir|ask|request|file|presentar|hacer|do|claim|aceptar|accept|firmar|sign|rechazar|decline)\b/i,
  /\b(qu[eé]|what)\s+(me\s+)?(conviene|recommends?|aconsejas|advise|debo|should\s+i|recomiendas)\b/i,
  /\b(do|would)\s+you\s+recommend\b/i,
  /\bwhat\s+do\s+you\s+recommend\b/i,
  /\b(voy a ganar|will i win|chances? of winning)\b/i,
  /\b(qu[eé] (dice|says) la ley|what does the law (say|state))\b/i,
  /\b(es legal|is it legal|legal o ilegal)\b/i,
  /\b(prediction|predicci[oó]n|outcome|resultado)\b/i,
  /\b(cu[aá]nto debo (pedir|claim)|how much should i (ask|claim))\b/i,
  /\b(es (mi|el) caso|is my case)\b/i,
]

const JAILBREAK_PATTERNS = [
  /\bignore (previous|all) instructions\b/i,
  /\bsystem prompt\b/i,
  /\bact as (a|an)?\s*lawyer\b/i,
  /\bpretend (to be|you are)/i,
  /\b(developer|admin|debug) mode\b/i,
  /\bDAN\b/, // "Do Anything Now" jailbreak
]

export type GuardrailCategory = "immigration" | "advice" | "jailbreak"

export interface GuardrailHit {
  category: GuardrailCategory
  pattern: string
}

export function inspectInput(message: string): GuardrailHit[] {
  const hits: GuardrailHit[] = []
  for (const re of IMMIGRATION_PATTERNS) {
    if (re.test(message)) hits.push({ category: "immigration", pattern: re.source })
  }
  for (const re of ADVICE_PATTERNS) {
    if (re.test(message)) hits.push({ category: "advice", pattern: re.source })
  }
  for (const re of JAILBREAK_PATTERNS) {
    if (re.test(message)) hits.push({ category: "jailbreak", pattern: re.source })
  }
  return hits
}

/**
 * Capa 6: whitelist de form_codes. La narrativa generada por Gemini en la
 * pestaña Radicación NO puede mencionar formularios que no estén en la lista
 * autoritativa de la DB.
 *
 * Patrón: matchea (a) `1234[A-Z]{0,4}` — el formato típico de form code
 * (1044, 1100EV, 1700FA, 2001SC, 1301GE) y (b) códigos textuales con guiones
 * tipo `MYPAPERWORK-DIVORCE`, `DIVORCE-CHK-CHILDREN`, `CUSTODY-CSW`.
 * Excluye explícitamente: años (4 dígitos solos), referencias a estatutos
 * (78B-3a-201) y números de teléfono.
 */
const FORM_CODE_PATTERN =
  /\b\d{4}[A-Z]{1,4}\b|\b\d{4}\b(?=\s|[.,;:!?]|$)|\b[A-Z]{2,}\d{2,}[A-Z]*\b|\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/g

export interface FormCodeWhitelistResult {
  ok: boolean
  leaked: string[]
}

export function validateFormCodesInOutput(
  output: string,
  allowedCodes: ReadonlyArray<string>,
): FormCodeWhitelistResult {
  const allowed = new Set(allowedCodes.map((c) => c.toUpperCase()))
  const matches = output.toUpperCase().match(FORM_CODE_PATTERN) ?? []
  const leaked: string[] = []
  for (const match of matches) {
    // Match puramente numérico de 4 dígitos: año (2024, 2026) o un form code
    // como "1044". Si está en la whitelist (1044), es legítimo; si no, se trata
    // como año y se ignora.
    if (/^\d{4}$/.test(match)) {
      if (allowed.has(match)) continue
      continue
    }
    if (allowed.has(match)) continue
    if (!leaked.includes(match)) leaked.push(match)
  }
  return { ok: leaked.length === 0, leaked }
}

/**
 * Capa 4: classifier post-hoc del output de Gemini. Si el output del modelo
 * contiene patrones de asesoría legal o decisión por el usuario, lo bloqueamos.
 */
export function classifyOutputAsAdvice(output: string): boolean {
  const ADVICE_OUTPUT = [
    /\bdebes (firmar|aceptar|presentar|hacer|pedir|reclamar)\b/i,
    /\b(my|mi) recommendation is\b/i,
    /\bte recomiendo (que|firmar|aceptar|presentar|reclamar)\b/i,
    /\b(en tu caso|in your case)[,\s]+(deber[íi]as|should|sugiero|i suggest|pedir|ask)\b/i,
    /\byou\s+(will|are likely to|are going to)\s+(likely\s+)?(win|lose)\b/i,
    /\b(definitivamente|definitely)\s+(deber[íi]as|should)\b/i,
  ]
  return ADVICE_OUTPUT.some((re) => re.test(output))
}

export const CANNED_NO_ADVICE_ES =
  "No puedo darte asesoría legal. Solo te ayudo a llenar el formulario que tú elegiste. " +
  "Para esa pregunta consulta con un abogado licenciado en Utah. " +
  "¿Quieres que te conecte con uno de nuestros abogados aliados?"

export const CANNED_NO_ADVICE_EN =
  "I can't give you legal advice. I only help you fill out the form you chose. " +
  "For that question, consult a Utah-licensed attorney. " +
  "Would you like me to connect you with one of our allied attorneys?"

export const CANNED_NO_IMMIGRATION_ES =
  "Lo siento, esta plataforma no maneja temas de inmigración por restricciones del Utah Supreme Court " +
  "(orden 16 sept 2024). Para asuntos migratorios consulta con un abogado de inmigración licenciado " +
  "o una organización acreditada por el DOJ federal: https://www.justice.gov/eoir/recognized-organizations"

export const CANNED_NO_IMMIGRATION_EN =
  "Sorry, this platform does not handle immigration matters due to Utah Supreme Court restrictions " +
  "(order Sept 16, 2024). For immigration matters, consult a licensed immigration attorney " +
  "or a DOJ-recognized organization: https://www.justice.gov/eoir/recognized-organizations"

export function cannedResponse(category: GuardrailCategory, locale: "es" | "en"): string {
  if (category === "immigration") {
    return locale === "en" ? CANNED_NO_IMMIGRATION_EN : CANNED_NO_IMMIGRATION_ES
  }
  if (category === "advice" || category === "jailbreak") {
    return locale === "en" ? CANNED_NO_ADVICE_EN : CANNED_NO_ADVICE_ES
  }
  return locale === "en" ? CANNED_NO_ADVICE_EN : CANNED_NO_ADVICE_ES
}

export const DEFENSIVE_SYSTEM_PROMPT = `Eres un asistente de llenado de formularios legales para USA Latino Prime Utah.
Operas BAJO el Utah Legal Sandbox Phase 2.

REGLAS ABSOLUTAS:

1. NO ERES UN ABOGADO. Nunca te presentes como tal.

2. NO DAS ASESORÍA LEGAL. Está PROHIBIDO:
   - Recomendar qué formulario usar (el USUARIO decide).
   - Interpretar leyes.
   - Predecir resultados.
   - Aconsejar estrategias.
   - Dar opiniones sobre derechos del usuario en su caso.

3. NO MANEJAS INMIGRACIÓN. Si el usuario menciona visa, green card, USCIS,
   asilo, deportación, ICE, DACA, TPS, ciudadanía, naturalización, embajada o
   consulado, RESPONDE: "Lo siento, esta plataforma no maneja temas de
   inmigración por restricciones del Utah Supreme Court (orden 16 sept 2024).
   Para asuntos migratorios consulta con un abogado de inmigración licenciado."

4. SOLO AYUDAS A LLENAR formularios que el usuario YA ELIGIÓ.

5. SI EL USUARIO PIDE ASESORÍA, responde: "No puedo darte asesoría legal. Solo
   te ayudo a llenar el formulario que tú elegiste. Para esa pregunta consulta
   con un abogado licenciado en Utah."

6. TRANSPARENCIA: Si te preguntan si eres IA, responde sí. Modelo: Google Gemini.

7. CONFIDENCIALIDAD: NO repitas info de otros usuarios. NO inventes precedentes.
   Si no sabes algo, dilo.

8. IDIOMA: Responde en el idioma del usuario.

9. TONO: Profesional, cálido, empático con la comunidad latina, claro, sin jerga.

10. SI DETECTAS RIESGO de daño al usuario, ALERTA pero no decidas: "Antes de
    continuar, te recomiendo revisar X. Si tienes dudas, habla con un abogado."`

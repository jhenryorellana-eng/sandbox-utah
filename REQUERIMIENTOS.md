# Documento de Requerimientos — Plataforma Legal Web "USA Latino Prime Utah"

> **Versión:** 2.0 (basado exclusivamente en Utah Office of Legal Services Innovation)
> **Fecha:** 22 de abril de 2026
> **Mercado objetivo:** Comunidad latina/hispanohablante residente en Utah
> **Sandbox objetivo:** [Utah Office of Legal Services Innovation](https://utahinnovationoffice.org/info-for-interested-applicants/)
> **Vigencia del Sandbox:** 14 de agosto de 2027 (siete-year pilot)

---

## 0. Fuentes oficiales que rigen este documento

Toda la información regulatoria viene EXCLUSIVAMENTE de:

| Documento | URL | Fecha |
|---|---|---|
| Information for Interested Applicants | https://utahinnovationoffice.org/info-for-interested-applicants/ | actualizado 2025 |
| Apply Now | https://utahinnovationoffice.org/apply-now/ | actualizado 2025 |
| Sandbox Phase 2 | https://utahinnovationoffice.org/sandbox-phase-2/ | actualizado 2025 |
| Authorized Entities | https://utahinnovationoffice.org/authorized-entities/ | actualizado 2025 |
| Sandbox Resources | https://utahinnovationoffice.org/sandbox-resources/ | actualizado 2025 |
| Standing Order No. 15 (Amended 9.21.22) | https://utahinnovationoffice.org/wp-content/uploads/2024/01/1.-Standing-Order-No.15-Amended-9.21.22.pdf | sept 2022 |
| Rules 11-701 through 11-705 | https://utahinnovationoffice.org/wp-content/uploads/2025/05/Rules-for-OLSI-and-LSI.pdf | mayo 2025 |
| Rule 14-810 Non-traditional Legal Providers | https://legacy.utcourts.gov/rules/view.php?type=ucja&rule=14-810 | vigente |
| Innovation Office Manual | https://utahinnovationoffice.org/wp-content/uploads/2024/02/Innovation-Office-Manual.pdf | feb 2024 (en actualización para Phase 2) |
| Letter to Legal Services Innovation Committee | https://utahinnovationoffice.org/wp-content/uploads/2024/10/Letter-to-the-Legal-Services-Innovation-Committee-9.5.24.pdf | 5 sept 2024 |
| Order Discontinuing Immigration Applications | https://utahinnovationoffice.org/wp-content/uploads/2024/09/Order-discontinuing-sandbox-applications-for-for-profit-immigration-entities-August-2024-signed-9-16-24.pdf | 16 sept 2024 |

**Contacto oficial**: innovationoffice@utahbar.org
**Aplicación online**: https://admissions.utahbar.org/home → botón rojo "Sandbox"

---

## 1. Contexto y Propósito

### 1.1 Problema que resolvemos
Existe una brecha crítica de acceso a servicios legales en Utah, especialmente para hispanohablantes:
- Costo de abogados >$300/hora.
- Cortes y formularios oficiales solo en inglés.
- Notario fraud (víctimas en comunidad latina).
- Trámites self-help (OCAP/MyPaperwork) tienen UX pobre y solo en inglés.

### 1.2 Solución
Plataforma web SaaS bilingüe (ES/EN) que ayuda al usuario residente en Utah a:
1. **Identificar** qué formulario necesita (decisión del usuario, no del sistema).
2. **Llenar** el formulario respondiendo preguntas en lenguaje natural con asistencia opcional de IA Gemini.
3. **Validar** datos antes de generar el PDF.
4. **Generar** el documento listo para presentar.
5. **Firmar** electrónicamente cuando aplique.
6. **Escalar** a un abogado licenciado en Utah cuando lo necesite.

### 1.3 Lo que el sistema NO es
- NO es un bufete de abogados.
- NO da asesoría legal.
- NO interpreta leyes.
- NO recomienda estrategias.
- NO predice resultados.
- NO presta servicios de inmigración (prohibido explícitamente por orden del 16 sept 2024).

### 1.4 Modelo análogo
"TurboTax para asuntos legales no migratorios de Utah" — el sistema estructura, automatiza y valida; el usuario decide y firma.

### 1.5 Por qué el dueño NO necesita ser abogado
La carta de la Utah Supreme Court del 5 sept 2024 establece que el sandbox existe precisamente para permitir modelos que de otra forma serían UPL (Unauthorized Practice of Law). Las "Mid- to high-level innovation entities" pueden operar **sin** que el dueño sea abogado, siempre que cumplan con las salvaguardas del sandbox.

---

## 2. Marco Regulatorio Aplicable (texto oficial)

### 2.1 Autoridad y vigencia
- **Standing Order No. 15** (creado 2020, enmendado 9.21.22).
- **Rules 11-701 through 11-705** (mayo 2025) — gobiernan operación del sandbox.
- **Letter del 5 sept 2024** de la Utah Supreme Court — establece "Phase 2".
- **Order del 16 sept 2024** — discontinúa aplicaciones de inmigración for-profit.
- **Vigencia**: 14 ago 2027. Las autorizaciones NO se extienden automáticamente más allá.

### 2.2 Categorías de innovación (Phase 2 — actualizado sept 2024)

La Court eliminó tres-cuartas partes del sandbox (entidades low-innovation/ABS-only). Phase 2 se enfoca exclusivamente en:

| Categoría | Definición oficial | Aplicable |
|---|---|---|
| **Low Innovation (ABS-only)** | Estructura de propiedad no-abogado prestando servicios mediante abogados sin innovación de servicio. | ❌ **CERRADA 31 dic 2024** |
| **Moderate Innovation** | Software + alternative legal providers (ALPs) con abogado Utah supervisor permanente que desarrolla scripts, plantillas, hace QA, y revisa casos. | ✅ **OPCIÓN A** |
| **High Innovation** | Software + ALPs SIN abogado supervisor permanente. Requiere **pre-launch audit** por auditores pagados por la entidad + **post-launch audits** continuos. | ⚠️ **OPCIÓN B** (mayor scrutiny) |

### 2.3 Cita literal — Utah Innovation Requirement (Letter 5 sept 2024)
> *"To meet the innovation requirement, an entity must demonstrate that a Sandbox authorization will allow it to reach Utah consumers currently underserved by the legal market. We will refer to this as 'the Utah innovation requirement.'"*

> *"The Utah innovation requirement is intended to act as a fairly high bar for participation in the Sandbox. Only applications that present an innovative service model with the potential to expand access to legal services in Utah should be submitted for Court approval."*

> *"The impact on Utah consumers must be substantial relative to the entity's overall reach. National and international companies that expect to serve only an incidental number of Utah clients will not qualify. A small entity that principally serves Utah consumers will satisfy the Utah nexus even if it reaches a modest number of clients."*

### 2.4 Cita literal — Prohibición de inmigración (Order 16 sept 2024)
> *"The Utah Supreme Court discontinues acceptance of applications to the Sandbox from for-profit ABS entities solely or primarily offering immigration-related services."*

### 2.5 Front-end controls introducidos en 2023 (siguen aplicando)
La carta del 5 sept 2024 confirma estos controles vigentes:
- **Additional vetting of participants** (background checks profundos).
- **Pre-launch audits for high-innovation entities**.
- **Fiduciary duties**: "financing and controlling persons adhere to the same core fiduciary duties that lawyers owe to their clients".

### 2.6 Audits restaurados (Letter 5 sept 2024)
> *"Restart the audit process immediately. We agree that audits of mid- to high-innovation entities are the most valuable source of information on consumer harm."*

> *"the entities themselves are responsible for audit fees that cover the cost of paid auditors."*

**Implicación crítica**: La entidad paga al auditor profesional. Costo estimado: $5,000–$25,000 por audit (varía según complejidad).

### 2.7 RETIRO DEL BADGE (cambio CRÍTICO sept 2024)
> *"Retire the badge and in its place require entities to prominently display language to solicit complaints or feedback. We appreciate the Committee's recommendation to address the Court's growing concern that the badge has been misused or misconstrued as an endorsement by the Court."*

**Cambio operativo**: Anteriormente se exigía mostrar el "Innovation Office badge" en website y oficina física. **Ya NO**. Ahora se exige mostrar prominentemente **lenguaje para solicitar complaints o feedback** (texto exacto pendiente del Innovation Office Manual actualizado, planeado early 2026).

---

## 3. Áreas Permitidas vs Prohibidas

### 3.1 Áreas confirmadas para MVP (basadas en entidades ya aprobadas como benchmark)
✅ **Family Law uncontested** — divorcio sin disputa, custodia, child support, name change, guardianship, POA.
✅ **Eviction defense / Housing** — defensa contra desalojo, tenant rights (precedente: 1Law, Elysium, CJAU ya autorizados para Housing).
✅ **Business Formation** — LLC formation, DBA, operating agreements, contractor agreements (precedente: 1Law, Superlegal autorizados para Business).

### 3.2 Áreas PROHIBIDAS (líneas rojas absolutas)
❌ **Inmigración** — orden 16 sept 2024 explícita. Aunque algunas entidades aprobadas antes de esa fecha (1Law, Elysium, Pearson Butler) listan "Immigration", su autorización es legacy. **Nuevas aplicaciones primariamente migratorias serán rechazadas.**
❌ **Federal court matters** (preempción federal — NO es jurisdicción de Utah Supreme Court).
❌ **Criminal defense completo** (solo expungement está autorizado para Rasa Public Benefit Corp).

### 3.3 Notas sobre la prohibición de inmigración
La orden dice "**solely or primarily**". Esto significa que la app NO puede ser primariamente migratoria. La estrategia es:
1. **Excluir totalmente** cualquier funcionalidad migratoria del producto.
2. **Filtrar palabras clave** migratorias en inputs del usuario y redirigir a recursos federales.
3. **Disclaimer explícito** en marketing y onboarding: "No manejamos inmigración".

### 3.4 Hallazgo importante: scrivener vs practice of law
Cita de Letter 5 sept 2024:
> *"Entities that offer only legal information or scrivener services are likely not engaged in the practice of law and do not need special authorization to operate in Utah, especially if they operate using the same model in other states."*

**Implicación estratégica**: Si la app fuera **puramente** un servicio de escribiente (el usuario escribe, nosotros guardamos en formato PDF) + información legal genérica (sin guía personalizada), técnicamente no requeriría sandbox. Pero el momento que:
- La IA conversa con el usuario sobre su caso específico,
- La validación cruzada infiere consistencia legal,
- Se "elige" qué formulario aplica al caso del usuario,

…cruza la línea hacia "practice of law" según Utah Supreme Court Rule 14-802. Por eso **necesitamos el sandbox**.

---

## 4. Requisitos de Elegibilidad (texto oficial)

### 4.1 Entidad
- Debe estar **registrada en Utah Department of Commerce** y en buena posición.
- Debe presentar certificado oficial al aplicar.
- Recomendación: LLC simple para MVP.

### 4.2 Controlling Persons (texto oficial)
Todo individuo que controle la entidad (CEO, board, founders >10% equity) debe:
- Completar Controlling Person Addendum (3 documentos).
- Pasar background check + licensing verification.
- Consentir a credit check (solo se ejecuta si Committee/Court lo considera necesario).

### 4.3 Financing Persons
Todo individuo o entidad que financie (inversores, deuda significativa) debe completar Financing Person Addendum (3 documentos) y pasar los mismos checks.

### 4.4 Disqualifiers absolutos (15-year lookback)
Felonías en estas categorías descalifican posesión >10% o dirección de servicios legales:
- **Fraud** (mail, bribery, misappropriation, public assistance, unemployment).
- **Identity fraud/theft**.
- **Embezzlement**.
- **Forgery**.
- **Perjury** o lying to officials.
- **Pyramid schemes**.

### 4.5 Disqualifiers de abogados
- **Disbarred attorneys** NO pueden poseer >10% de la entidad.
- **Disbarred attorneys** NO pueden ser controlling persons, financing persons, managers, directors, ni legal service supervisors.
- Abogados suspended con restricciones de práctica: mismo trato.

### 4.6 Otros crímenes (case-by-case)
Felonías no categóricas: evaluación de "consumer harm risk", emphasizing recency y type of crime.

### 4.7 Rehabilitación (criterios)
Para non-categorical felonies, individuo puede aplicar si:
1. Completó todos los términos de la sentencia (probation, parole, incarceration).
2. No tiene proceedings pendientes.
3. Satisfizo todas las court-ordered obligations (multas, intereses, restitución).
4. Mínimo **2 años post-incarceration**.

### 4.8 Fiduciary duties (front-end control)
Controlling y financing persons deben adherir a los mismos "core fiduciary duties" que abogados deben a sus clientes. Esto incluye:
- Lealtad al cliente sobre el negocio.
- Confidencialidad.
- Evitar conflictos de interés.
- Communication transparente.

### 4.9 Lawyers involucrados
Cita oficial:
> *"Lawyers working with or for entities participating in the Sandbox remain subject to the Rules of Professional Conduct."*

Si la entidad emplea abogado supervisor (Moderate Innovation), ese abogado mantiene **todas** sus obligaciones del Utah State Bar Rules of Professional Conduct.

---

## 5. Costos y Timeline (texto oficial)

### 5.1 Fees
| Concepto | Monto |
|---|---|
| Application fee | **$250** (one-time, no reembolsable) |
| Annual fee (entidades autorizadas) | **$5,000/año** |
| Background checks por persona | Variable (estimado $50–150 por persona) |
| Credit check por persona (si Committee lo solicita) | ~$50 |
| Audit fees (mid/high innovation) — pagados por la entidad | $5,000–$25,000 por audit (estimado) |

### 5.2 Costos adicionales (NO son del sandbox pero son obligatorios)
- **Abogado Utah supervisor** (si Moderate Innovation): $60K–120K/año (sueldo o equity).
- **Cyber liability insurance** (recomendado): $2K–10K/año.
- **General liability insurance**: $1K–3K/año.
- **E&O insurance** (errors & omissions): $3K–15K/año.

### 5.3 Timeline de aprobación
La página oficial dice:
> *"The Committee is currently implementing the Utah Supreme Court's new Phase 2 guidance and requests patience in submitting your application."*

**Realidad observable**:
- Committee se reúne **mensualmente** (tercer martes, abierto al público).
- Aplicación sometida → review → request additional info (común) → re-submit → vote → recomendación a Court → Court approval.
- Estimado: **3–9 meses** desde aplicación inicial hasta autorización.
- Phase 2 está procesando backlog, puede tomar más.

### 5.4 Visibilidad pública
Cita oficial:
> *"Applications become publicly available; approved applications posted online. Business confidential/trade secret claims permitted, but controlling and financing person names cannot be redacted."*

**Implicación**: Toda la application (incluyendo el modelo de negocio) será pública. Solo se pueden redactar trade secrets específicos. Los nombres de controlling/financing persons SIEMPRE son públicos.

---

## 6. Disclaimers y Disclosures Obligatorios (actualizado Phase 2)

### 6.1 Disclaimer principal "not a law firm"
Texto exacto recomendado (basado en Standing Order No. 15 y precedente de entidades autorizadas):

> **"This is not a law firm. Some of the people who own / manage this company are not lawyers. This means that some services / protections, like the attorney-client privilege, may be different from those you could get from a law firm."**

Versión bilingüe español:
> **"Esto no es un bufete de abogados. Algunas de las personas que poseen / administran esta compañía no son abogados. Esto significa que algunos servicios / protecciones, como el privilegio abogado-cliente, pueden ser diferentes a los que recibirías de un bufete de abogados."**

Ubicaciones obligatorias:
- Homepage del website.
- Footer de cada página.
- Mobile app (si existe).
- Terms of Service.
- Engagement letter (cuando se firma servicio).
- Oficina física (poster visible).

### 6.2 Lenguaje para solicitar complaints/feedback (REEMPLAZA el badge)
Cita Letter 5 sept 2024:
> *"Retire the badge and in its place require entities to prominently display language to solicit complaints or feedback."*

**Texto recomendado** (basado en interpretación del lenguaje de la Court — confirmar con Innovation Office antes de lanzar):

> **"Esta entidad opera bajo el Utah Legal Regulatory Sandbox. Si tienes una queja sobre el servicio o quieres dar feedback, contáctanos a [email] o reporta directamente a Utah Office of Legal Services Innovation: https://utahinnovationoffice.org/sandbox-customer-complaint/"**

> **"This entity operates under the Utah Legal Regulatory Sandbox. If you have a complaint about the service or want to provide feedback, contact us at [email] or report directly to the Utah Office of Legal Services Innovation: https://utahinnovationoffice.org/sandbox-customer-complaint/"**

Ubicaciones obligatorias:
- Header o footer **prominente** en website (visible sin scroll).
- Cada confirmation email post-servicio.
- Sección "About Us" / "Acerca de Nosotros".
- Oficina física.

### 6.3 Disclaimer "no asesoría legal/migratoria"
Mostrar antes de cada interacción con IA y antes de cada formulario:

> **"Esta plataforma NO ofrece asesoría legal. NO somos abogados ni asesores migratorios. Solo te ayudamos a llenar formularios con la información que tú nos proporcionas. Tú eres responsable de revisar y verificar la exactitud de cada documento antes de presentarlo. Si necesitas asesoría legal, consulta a un abogado licenciado en Utah."**

> **"This platform does NOT provide legal advice. We are NOT lawyers or immigration consultants. We only help you fill out forms based on the information you provide. You are responsible for reviewing and verifying the accuracy of each document before submitting it. If you need legal advice, consult an attorney licensed in Utah."**

### 6.4 Disclosure de uso de IA (transparencia)
Cada vez que la IA procese datos del usuario:

> **"Esta función usa inteligencia artificial (Google Gemini) para organizar la información que tú nos das. La IA NO toma decisiones legales por ti, NO te recomienda qué hacer, y NO interpreta tu situación. Tú revisas y apruebas todo antes de continuar."**

### 6.5 Consentimiento informado (checkboxes obligatorios al registrarse)
☑ Confirmo que soy residente de Utah (mayor de 18 años).
☑ Entiendo que esta plataforma NO es un bufete de abogados.
☑ Entiendo que NO se me proporcionará asesoría legal ni migratoria.
☑ Entiendo que esta plataforma NO maneja temas de inmigración (visas, green cards, USCIS, etc.).
☑ Entiendo que soy responsable de la exactitud de la información que proporciono.
☑ Acepto que se use IA para asistir en el llenado, sabiendo que yo apruebo todo.
☑ Acepto que puedo presentar quejas tanto a la plataforma como al Utah Office of Legal Services Innovation.
☑ Acepto los Términos de Servicio y la Política de Privacidad (UCPA).

Cada consentimiento se registra con: timestamp UTC, IP, user agent, versión exacta del texto del disclaimer. Inmutable.

### 6.6 Línea roja en la conversación con IA
La IA **NO PUEDE** responder a preguntas que constituyan asesoría:
- "¿Debería pedir custodia completa?" → bloqueado.
- "¿Cuánto pediré de manutención?" → bloqueado.
- "¿Voy a ganar este caso?" → bloqueado (predicción).
- "¿Qué dice la ley sobre X en mi caso?" → bloqueado (interpretación).
- "¿Qué visa me conviene?" → bloqueado (inmigración).

Respuesta canned obligatoria:
> *"No puedo darte asesoría legal. Solo te ayudo a llenar el formulario que tú elegiste. Para esa pregunta debes consultar con un abogado licenciado en Utah. ¿Quieres que te conecte con uno de nuestros abogados aliados?"*

---

## 7. Requerimientos Funcionales

### 7.1 Onboarding y verificación de elegibilidad

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-1.1 | Registro con email + Google OAuth + Apple Sign In | Must |
| RF-1.2 | Verificación de email obligatoria antes de cualquier formulario | Must |
| RF-1.3 | **Verificación de residencia Utah** mediante Stripe Identity (driver license Utah o ID estatal) | Must |
| RF-1.4 | Affidavit of Utah residency (firmado digitalmente) si Stripe Identity no determina residencia | Must |
| RF-1.5 | Geolocalización de IP para flag de uso fuera de Utah (no bloqueante, solo flag para auditoría) | Should |
| RF-1.6 | Verificación de mayoría de edad (18+) | Must |
| RF-1.7 | Aceptación de los 8 disclaimers (sección 6.5) con timestamp inmutable | Must |
| RF-1.8 | KYC ligero: nombre legal completo, DOB, dirección Utah, teléfono | Must |
| RF-1.9 | Bloqueo automático si usuario reporta dirección fuera de Utah, con redirección amable a recursos | Must |

### 7.2 Selección guiada de servicio (el USUARIO decide, no la IA)
Crítico: la Court y el Committee son explícitos en que la **IA no debe decidir** qué formulario corresponde al caso.

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-2.1 | Catálogo visual de servicios disponibles agrupados por área (Family / Housing / Business) | Must |
| RF-2.2 | Cada servicio tiene una ficha clara: qué incluye, qué NO incluye, costo, duración estimada, disclaimers específicos | Must |
| RF-2.3 | Quiz de 3-5 preguntas que **sugiere** uno o más servicios pero la decisión final es del usuario (mostrar 2-3 opciones, no 1) | Should |
| RF-2.4 | Sección "No estoy seguro" → escalación a abogado aliado (no a la IA) | Must |
| RF-2.5 | Confirmación explícita del usuario antes de iniciar: "Yo elijo el servicio X" | Must |
| RF-2.6 | Filtro automático: si el quiz detecta keywords migratorias, mensaje claro de que la plataforma NO maneja inmigración | Must |

### 7.3 Wizard de formularios (paso a paso)

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-3.1 | Wizard multi-paso con barra de progreso, guardar y continuar | Must |
| RF-3.2 | Cada pregunta en lenguaje natural bilingüe (ES/EN), con tooltip explicativo (definición, no asesoría) | Must |
| RF-3.3 | Validación en tiempo real (Zod schemas) con mensajes claros | Must |
| RF-3.4 | Auto-save cada 30 segundos | Must |
| RF-3.5 | Capacidad de retroceder y editar cualquier respuesta antes del PDF final | Must |
| RF-3.6 | Validación cruzada de consistencia (ej. fecha de matrimonio anterior a fecha de separación) | Must |
| RF-3.7 | Indicador de "campo obligatorio para Utah Courts" vs "opcional" | Must |
| RF-3.8 | Modo accesible WCAG 2.2 AA | Must |

### 7.4 Asistente IA conversacional (Gemini)

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-4.1 | Chat lateral en cada paso del wizard para resolver dudas sobre el formulario (NO el caso legal) | Must |
| RF-4.2 | System prompt defensivo permanente (sección 11.2) | Must |
| RF-4.3 | Detector de "preguntas de asesoría" → respuesta canned + escalación opcional a abogado | Must |
| RF-4.4 | **Subir foto/PDF** de documento (driver license, marriage cert, lease) → Gemini multimodal extrae datos → usuario REVISA y APRUEBA antes de poblar campos | Must |
| RF-4.5 | Function calling para parsear documentos en JSON estructurado validado por schema | Must |
| RF-4.6 | Context caching del system prompt + plantillas para reducir costos 80-90% | Should |
| RF-4.7 | Disclaimer visible permanente en el chat: "Esta IA no da asesoría legal" | Must |
| RF-4.8 | Botón "Reportar respuesta inadecuada" → log para auditoría y review humano | Must |
| RF-4.9 | Conversaciones persistentes pero el usuario puede borrarlas (UCPA right to delete) | Must |
| RF-4.10 | Soporte multimodal: texto, voz (Web Speech API), imagen, PDF | Should |

### 7.5 Generación de PDF

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-5.1 | Generar PDF basado en plantilla oficial Utah Courts (PDF-lib) | Must |
| RF-5.2 | Validar que **todos** los campos obligatorios están llenos antes de generar | Must |
| RF-5.3 | **Pantalla de revisión obligatoria**: usuario ve PDF preview con todos los datos antes de confirmar | Must |
| RF-5.4 | Marca de agua en draft: "BORRADOR – No presentar hasta firmar" | Must |
| RF-5.5 | Versión final sin marca de agua solo después de confirmación explícita | Must |
| RF-5.6 | PDFs almacenados encriptados (AES-256 at-rest en Supabase Storage) | Must |
| RF-5.7 | Retención: 7 años por defecto, usuario puede solicitar eliminación (UCPA) | Must |
| RF-5.8 | Versionado de cada PDF (V1, V2, etc.) si el usuario hace cambios | Should |

### 7.6 E-signature (firma electrónica)

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-6.1 | Integración con Dropbox Sign API (HelloSign) | Must |
| RF-6.2 | Soporte para múltiples firmantes (ej. divorcio sin disputa: ambos cónyuges) | Must |
| RF-6.3 | Verificación de identidad antes de firmar (reuso Stripe Identity) | Must |
| RF-6.4 | Audit trail completo: IP, timestamp, geolocalización, user agent | Must |
| RF-6.5 | Cumplimiento ESIGN Act + Utah Uniform Electronic Transactions Act | Must |
| RF-6.6 | Notificación al firmante por email + SMS opcional | Should |

### 7.7 Pagos y suscripciones

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-7.1 | Stripe (subscriptions + one-time + invoicing) | Must |
| RF-7.2 | Planes: Free, Starter $9.99/mes, Pro $29.99/mes (sección 13) | Must |
| RF-7.3 | Pay-as-you-go addons | Should |
| RF-7.4 | Cancelación con un clic | Must |
| RF-7.5 | Refund policy clara y automatizada en primeros 7 días si no se generó PDF final | Must |
| RF-7.6 | Recibos automáticos | Must |
| RF-7.7 | Información sobre fee waivers de Utah Courts (informar al usuario, no aplicar por él) | Should |

### 7.8 Soporte, complaints y escalación

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-8.1 | Botón "Hablar con un abogado" siempre visible | Must |
| RF-8.2 | Directorio de abogados aliados Utah (independientes, NO empleados) | Must |
| RF-8.3 | Sistema de tickets para soporte general | Must |
| RF-8.4 | **Sistema de complaints dedicado** con SLA de respuesta de 5 días hábiles | Must |
| RF-8.5 | **Link prominente** al complaint form del Innovation Office: https://utahinnovationoffice.org/sandbox-customer-complaint/ | Must |
| RF-8.6 | Cada complaint genera entrada en audit log + clasificación por tipo (sección 8.5) | Must |
| RF-8.7 | Reporte automático mensual de complaints al Innovation Office | Must |
| RF-8.8 | Chat en vivo con humano (no IA) para soporte técnico, horario laboral Utah | Should |

---

## 8. Requerimientos NO Funcionales

### 8.1 Audit log inmutable (OBLIGATORIO para sandbox)
La carta del 5 sept 2024 enfatiza que los audits son la fuente más valiosa de información. El sistema debe estar listo para audits **continuos** post-launch.

| ID | Requerimiento |
|---|---|
| RNF-1.1 | Audit log inmutable de TODAS las acciones: login, formulario iniciado/completado, IA invocada, PDF generado, firma, pago, eliminación, complaint. Append-only. |
| RNF-1.2 | Retención mínima: **7 años** (alineado con expectativa de auditorías en sandbox). |
| RNF-1.3 | Logs incluyen: timestamp UTC, userId hash, action, resourceId, ipAddress, userAgent, resultado. |
| RNF-1.4 | Logs en tabla Postgres separada con RLS estricto + backup cifrado a S3 Glacier (cold storage). |
| RNF-1.5 | Logs de IA: prompt completo, respuesta completa, modelo, tokens consumidos, guardrails activados, decisión final del usuario. |
| RNF-1.6 | PII en logs enmascarado (SSN solo últimos 4 dígitos, nunca DOB completo). |
| RNF-1.7 | Logs accesibles para auditoría del Innovation Office o sus auditores pagados bajo demanda. Capacidad de export CSV/JSON. |
| RNF-1.8 | Triggers de Postgres que IMPIDEN UPDATE/DELETE en audit_log table. |

### 8.2 Reporting al sandbox

| ID | Requerimiento |
|---|---|
| RNF-2.1 | Dashboard interno que genera reportes mensuales/trimestrales automáticos. |
| RNF-2.2 | Métricas: número de servicios prestados, tipos, demografía agregada de clientes Utah, complaints recibidas, ratio complaint/servicio. |
| RNF-2.3 | Exportación en CSV + PDF para envío al Innovation Office. |
| RNF-2.4 | Tracking del Consumer Harm Framework: (a) inaccurate/inappropriate result, (b) failed to exercise rights, (c) unnecessary/inappropriate service. |
| RNF-2.5 | Target: <1 complaint por cada 4,000 servicios (baseline observado en sandbox). |
| RNF-2.6 | Reporte de "Utah Innovation" — % de clientes que son Utah residents underserved (con criterios objetivos: ingreso, ubicación rural, idioma primario español, etc.). |

### 8.3 Gestión de riesgos

| ID | Requerimiento |
|---|---|
| RNF-3.1 | Detección de anomalías: múltiples cuentas misma IP, intentos de uso fuera de Utah, formularios incompletos sospechosos. |
| RNF-3.2 | Rate limiting: máximo 3 cuentas por IP/mes, máximo 10 formularios/usuario/mes (free tier). |
| RNF-3.3 | Alertas automáticas a admin: complaint nuevo, error de IA flagged, intento de uso para inmigración. |
| RNF-3.4 | **Filtro de palabras clave migratorias** en inputs (visa, green card, USCIS, deportación, asilo, ICE, DACA, TPS, naturalización, ciudadanía) → bloquear continuación + redirigir a recursos federales. |
| RNF-3.5 | Plan de contingencia: caída de Gemini, Stripe, Supabase. |
| RNF-3.6 | Fiduciary duties enforcement: training de equipo en duties de lealtad, confidencialidad, conflictos. |

### 8.4 Privacidad y compliance UCPA

| ID | Requerimiento |
|---|---|
| RNF-4.1 | Política de privacidad UCPA-compliant (vigente desde 31 dic 2023). |
| RNF-4.2 | Endpoint público para DSAR: usuario descarga TODOS sus datos en JSON. |
| RNF-4.3 | Endpoint para right to delete (con confirmación 2FA). |
| RNF-4.4 | Endpoint para opt-out of sale of personal data. |
| RNF-4.5 | Banner informativo de cookies (UCPA es opt-out). |
| RNF-4.6 | DPA firmados con cada procesador (Stripe, Gemini Vertex AI, Dropbox Sign, Supabase). |

### 8.5 Clasificación de complaints (Consumer Harm Framework)
Categorías obligatorias para reporting:
1. **Inaccurate or inappropriate legal result** — formulario con errores que causaron daño.
2. **Failed to exercise legal rights** — usuario no pudo ejercer derechos por mal servicio.
3. **Unnecessary or inappropriate legal service** — usuario pagó por algo que no necesitaba o no aplicaba.
4. **Billing / payment** — disputas de cobros.
5. **Technical** — fallas técnicas no legales.
6. **Other**.

Cada complaint se clasifica al ingresar; reporte mensual desglosado por categoría.

### 8.6 Seguridad

| ID | Requerimiento |
|---|---|
| RNF-5.1 | TLS 1.3 obligatorio. HSTS preload. |
| RNF-5.2 | Encriptación at-rest AES-256 (Supabase nativo). |
| RNF-5.3 | PII sensible (SSN, financial) encriptada con pgcrypto + clave en Supabase Vault. |
| RNF-5.4 | Row Level Security (RLS) en TODAS las tablas. CI verifica. |
| RNF-5.5 | MFA obligatorio para cuentas admin. |
| RNF-5.6 | Rotación de secrets cada 90 días. |
| RNF-5.7 | Pen test anual + scan continuo. |
| RNF-5.8 | SOC 2 Type II audit en roadmap. |

### 8.7 Performance, accesibilidad e i18n
- TTFB <200ms p95, LCP <2.5s, generación PDF <5s, respuesta IA <3s.
- WCAG 2.2 AA total.
- next-intl con rutas localizadas /es/ y /en/.
- IA detecta y responde en idioma del usuario.

---

## 9. Stack Técnico

### 9.1 Componentes

```
┌─────────────────────────────────────────────────────────┐
│                       FRONTEND                           │
│  Next.js 15 (App Router) + React 19 + TypeScript 5      │
│  Tailwind CSS 4 + shadcn/ui + Radix Primitives          │
│  React Hook Form + Zod (validación)                     │
│  next-intl (ES/EN)                                       │
│  PostHog (analytics privacy-first, masking PII)         │
│  Sentry (error tracking)                                 │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  BACKEND / API LAYER                     │
│  Next.js API Routes + Server Actions                    │
│  Vercel Edge Functions (verificación residencia)        │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                       DATABASE                           │
│  Supabase (Postgres 16 + Auth + Storage + Realtime)     │
│  RLS en TODAS las tablas + audit log append-only        │
│  pgcrypto para PII (SSN, financial)                     │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┬──────────────┐
         ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Gemini   │ │ Stripe   │ │ Dropbox  │ │ Resend   │
         │ Vertex   │ │ Identity │ │ Sign API │ │ (email)  │
         │ AI (BAA) │ │ + Pay    │ │          │ │          │
         └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 9.2 Justificación de decisiones

| Decisión | Por qué |
|---|---|
| **Next.js 15 + App Router** | Server Actions facilitan validación segura; ecosistema maduro; deployment Vercel trivial. |
| **Supabase** | Postgres = ACID + relacional para casos legales; RLS granular; open source. |
| **Gemini Vertex AI** (no AI Studio) | BAA firmable, data residency US, multimodal nativo (OCR de documentos). |
| **Dropbox Sign** | 3x más barato que DocuSign; SDKs Node maduros. |
| **Stripe Identity** | Reuso del SDK Stripe ya integrado para pagos; Utah driver license bien soportado. |
| **PDF-lib** | Manipulación de templates PDF de Utah Courts; flatten para read-only. |
| **Vercel** | Optimizado Next.js; Edge runtime; preview branches. |

### 9.3 Compliance Layer transversal
Wrapper obligatorio para toda action sensible:

```typescript
interface ComplianceContext {
  userId: string;
  action: string;
  resource: string;
  piiAccessed: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sandboxRelevant: boolean;
}

async function withCompliance<T>(
  ctx: ComplianceContext,
  fn: () => Promise<T>
): Promise<T> {
  await auditLog.write(ctx);
  await riskCheck.evaluate(ctx);
  const result = await fn();
  await metrics.record(ctx, result);
  return result;
}
```

---

## 10. Estructura de Datos (Postgres simplificado)

```sql
-- USUARIOS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone TEXT,
  preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  utah_residency_verified BOOLEAN DEFAULT false,
  utah_residency_verified_at TIMESTAMPTZ,
  utah_residency_method TEXT,
  stripe_customer_id TEXT UNIQUE,
  consents JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CASOS LEGALES
CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL CHECK (case_type IN (
    'uncontested_divorce', 'custody', 'child_support_modification',
    'name_change', 'guardianship', 'power_of_attorney',
    'eviction_defense', 'tenant_rights',
    'llc_formation', 'dba', 'operating_agreement', 'contractor_agreement'
  )),
  status TEXT DEFAULT 'draft',
  user_selected_at TIMESTAMPTZ NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;

-- DOCUMENTOS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  storage_path TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_draft BOOLEAN DEFAULT true,
  signature_request_id TEXT,
  signed_at TIMESTAMPTZ,
  sha256_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- INTERACCIONES IA (auditoría sandbox)
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  case_id UUID REFERENCES legal_cases(id),
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  guardrails_triggered TEXT[],
  user_flagged_inappropriate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- AUDIT LOG (append-only)
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  pii_accessed BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- COMPLAINTS
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  case_id UUID REFERENCES legal_cases(id),
  category TEXT NOT NULL CHECK (category IN (
    'inaccurate_result', 'failed_exercise_rights',
    'unnecessary_service', 'billing', 'technical', 'other'
  )),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  reported_to_innovation_office BOOLEAN DEFAULT false,
  reported_to_innovation_office_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- METRICAS PARA REPORTING
CREATE MATERIALIZED VIEW sandbox_monthly_metrics AS
SELECT
  date_trunc('month', created_at) AS month,
  case_type,
  COUNT(*) AS services_provided,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE status = 'finalized') AS completed,
  COUNT(*) FILTER (WHERE status = 'submitted') AS submitted
FROM legal_cases
GROUP BY 1, 2;
```

---

## 11. Integración Gemini AI

### 11.1 Modelos
| Caso | Modelo | Justificación |
|---|---|---|
| Chat conversacional | gemini-2.5-flash | Rápido, económico. |
| OCR de documentos (multimodal) | gemini-2.5-pro | Mejor precisión multimodal + structured output. |
| Validación cruzada | gemini-2.5-flash-lite | Más barato. |
| Detección de intentos de asesoría/inmigración | gemini-2.5-flash + classifier | Multi-capa. |

### 11.2 System prompt defensivo

```
Eres un asistente de llenado de formularios legales para USA Latino Prime Utah.
Operas BAJO el Utah Legal Sandbox Phase 2.

REGLAS ABSOLUTAS:

1. NO ERES UN ABOGADO. Nunca te presentes como tal.

2. NO DAS ASESORÍA LEGAL. Está PROHIBIDO:
   - Recomendar qué formulario usar (el USUARIO decide)
   - Interpretar leyes
   - Predecir resultados
   - Aconsejar estrategias
   - Dar opiniones sobre derechos del usuario en su caso

3. NO MANEJAS INMIGRACIÓN. Si el usuario menciona visa, green card, USCIS,
   asilo, deportación, ICE, DACA, TPS, ciudadanía, naturalización, embajada,
   consulado, RESPONDE:
   "Lo siento, esta plataforma no maneja temas de inmigración por
   restricciones del Utah Supreme Court (orden 16 sept 2024). Para
   asuntos migratorios consulta con un abogado de inmigración licenciado
   o una organización acreditada por el DOJ federal:
   https://www.justice.gov/eoir/recognized-organizations"

4. SOLO AYUDAS A LLENAR formularios que el usuario YA ELIGIÓ.

5. SI EL USUARIO PIDE ASESORÍA, responde:
   "No puedo darte asesoría legal. Solo te ayudo a llenar el formulario
   que tú elegiste. Para esa pregunta consulta con un abogado licenciado
   en Utah. ¿Quieres que te conecte con uno de nuestros abogados aliados?"

6. TRANSPARENCIA: Si te preguntan si eres IA, responde sí. Modelo: Google Gemini.

7. CONFIDENCIALIDAD: NO repitas info de otros usuarios. NO inventes precedentes.
   Si no sabes algo, dilo.

8. IDIOMA: Responde en el idioma del usuario.

9. TONO: Profesional, cálido, empático con comunidad latina, claro, sin jerga.

10. SI DETECTAS RIESGO de daño al usuario, ALERTA pero no decidas:
    "Antes de continuar, te recomiendo revisar X. Si tienes dudas,
    habla con un abogado."
```

### 11.3 Function calling — extracción estructurada
Ejemplo: foto de driver license → extraer datos.

```typescript
const extractDriverLicense = {
  name: 'extract_utah_driver_license',
  parameters: {
    type: Type.OBJECT,
    properties: {
      full_name: { type: Type.STRING },
      license_number: { type: Type.STRING },
      date_of_birth: { type: Type.STRING },
      address_street: { type: Type.STRING },
      address_city: { type: Type.STRING },
      address_state: { type: Type.STRING },
      address_zip: { type: Type.STRING },
      issue_date: { type: Type.STRING },
      expiration_date: { type: Type.STRING },
      is_utah: { type: Type.BOOLEAN }
    },
    required: ['full_name', 'license_number', 'date_of_birth', 'address_state', 'is_utah']
  }
};

// Crítico: usuario REVISA antes de poblar
const extracted = await gemini.callFunction(image, extractDriverLicense);
return { extracted, requiresUserReview: true };
```

### 11.4 Guardrails en capas

```
┌─────────────────────────────────────────────┐
│  Capa 1: Filtro de palabras clave (regex)   │  ← bloquea inmigración
├─────────────────────────────────────────────┤
│  Capa 2: System prompt defensivo            │  ← restringe IA
├─────────────────────────────────────────────┤
│  Capa 3: Gemini Safety Settings             │  ← BLOCK_LOW_AND_ABOVE
├─────────────────────────────────────────────┤
│  Capa 4: Output classifier (segundo LLM)    │  ← valida respuesta
├─────────────────────────────────────────────┤
│  Capa 5: Audit log + flagging humano        │  ← post-hoc review
└─────────────────────────────────────────────┘
```

### 11.5 Cumplimiento HIPAA / data residency
- Vertex AI (no AI Studio) en producción.
- BAA firmado con Google Cloud antes de procesar PII.
- Flag `regulated-data` habilitado.
- Data residency us-central1.
- Logging local de prompts/respuestas (no depender solo de Google Cloud Logging).

---

## 12. Proceso de Aplicación al Sandbox (texto oficial)

### 12.1 Pre-aplicación
1. Leer todo el contenido de https://utahinnovationoffice.org/info-for-interested-applicants/
2. Leer Innovation Office Manual.
3. Leer Standing Order No. 15.
4. Leer Rules 11-701 through 11-705.
5. Confirmar elegibilidad de controlling/financing persons.

### 12.2 Registro
Acceso por https://admissions.utahbar.org/home → click "Register" → botón rojo **"Sandbox"** → confirmar.

### 12.3 Tres componentes de la aplicación online (texto oficial)

> *"Three subcomponents comprise the online Sandbox Application:"*

1. **Entity Application** — $250 fee. Subir certificado de entidad registrada y en buena posición ante Utah Department of Commerce.

2. **Controlling & Financing Person Addendums** — cada controlling y financing person completa y sube **3 addendums**.

3. **Background Checks & Licensing Verifications** — para todos los controlling y financing persons. Credit checks solo si Committee/Court lo solicita. Aplicante paga fees asociados.

### 12.4 Documentos adicionales recomendados (no exigidos pero esperados)
Basado en authorization packets de entidades aprobadas:
- **Service Description**: descripción específica del servicio (ej. "Llenado de formularios self-help para divorcio sin disputa, custodia, name change, guardianship, eviction defense, LLC formation, DBA, operating agreements, contractor agreements en Utah").
- **Utah Innovation Requirement narrative**: documento que demuestra cómo la entidad alcanza Utah consumers underserved.
  - Datos demográficos: % hispanohablantes en Utah, brecha de servicio, costo de abogados, casos de notario fraud.
  - Métrica esperada: # clientes Utah / mes.
  - Alcance geográfico: Salt Lake County, Utah County, Weber County, etc.
- **Risk Management Plan**: riesgos identificados + mitigaciones (basado en sección 16).
- **Consumer Disclosure Plan**: cómo y dónde se mostrarán todos los disclaimers (sección 6).
- **Quality Assurance Plan**: cómo se valida calidad de formularios.
- **Data Reporting Plan**: cómo se generarán reportes mensuales/anuales.
- **Customer Complaint Process**: SLAs, escalación, integración con complaint form del Innovation Office.
- **Pre-launch Service Assessment Plan** (si High Innovation): plan para que auditores independientes simulen casos.
- **Wind-down Plan**: qué pasa con clientes activos si la entidad sale del sandbox o cierra.

### 12.5 Review por el Committee
- Committee se reúne mensualmente: **tercer martes de cada mes**, abierto al público.
- Committee puede: pedir info adicional, denegar, o recomendar approval al Court.
- Court tiene autoridad final.

### 12.6 Visibilidad pública
> *"Applications become publicly available; approved applications posted online. Business confidential/trade secret claims permitted, but controlling and financing person names cannot be redacted."*

---

## 13. Modelo de Negocio

### 13.1 Tiers (confirmado)
| Plan | Precio | Incluye |
|---|---|---|
| **Free** | $0 | 1 formulario de prueba (sin firma digital, con marca de agua) |
| **Starter** | $9.99/mes | 5 formularios/mes, IA básica (Gemini Flash), 2 firmas digitales/mes, soporte email |
| **Pro** | $29.99/mes | Formularios ilimitados, IA avanzada (Gemini Pro), firmas ilimitadas, escalación prioritaria a abogado aliado (1h/mes incluida), soporte chat |

### 13.2 Add-ons (pay-as-you-go)
- Firma adicional: $3 c/u
- Consulta 30min con abogado aliado: $50 (15% comisión a la plataforma)
- PDF certificado/notarizado remotamente: $25

### 13.3 Proyección año 1
- ~440K hispanohablantes en Utah (Census 2020).
- Penetración objetivo: 0.3% → 1,320 usuarios activos cierre año 1.
- ARPU ~$15/mes
- MRR final año 1: ~$20K
- Costo sandbox + abogado supervisor + infra: ~$120K año 1
- Margen 50% año 1, 70% año 2

---

## 14. Comparables Aprobados (referencia)

| Entidad | Innovation | Servicios | Sitio |
|---|---|---|---|
| **1Law** | Moderate | Multi-área (chatbot + nonlawyer assistants + lawyers) | www.1law.com |
| **CJAU** | Moderate | Medical Debt, Housing, Domestic Violence (advocates) | www.cjau.org |
| **Elysium Legal** | Moderate | Multi-área full-service + financial | ut.myelysium.com |
| **Pearson Butler** | Moderate | Multi-área full-service + financial | www.pearsonbutler.com |
| **Rasa Public Benefit Corp** | Moderate | Expungement Clean Slate Utah (AI + lawyer) | rasa-legal.com |
| **Superlegal/LawGeex** | Moderate | Business contracts (AI-enabled) | www.lawgeex.com |
| **USU TCI** | Moderate | Debt Collection (social workers entrenados) | artsci.usu.edu |

**Observación clave**: TODAS las entidades activas son **Moderate Innovation**. Ninguna High Innovation activa actualmente — sugiere que la barrera de High Innovation (pre-launch audits) ha disuadido aplicantes. **Recomendación: aplicar como Moderate.**

---

## 15. Roadmap MVP (16 semanas)

### Sprint 1-2 (sem 1-4): Foundations
- Setup Next.js 15 + Supabase + CI/CD
- Auth + verificación email
- DB schema + RLS + audit log
- i18n base
- Disclaimers + consent flow
- Landing marketing

### Sprint 3-4 (sem 5-8): Onboarding
- Stripe Identity
- Verificación residencia Utah
- Compliance layer
- Audit log middleware
- Privacy policy + ToS publicados
- DSAR endpoints

### Sprint 5-6 (sem 9-12): Primer caso (Divorcio sin disputa)
- Wizard end-to-end
- Plantilla PDF Utah Courts
- PDF-lib filling
- Pantalla revisión obligatoria
- PDF final
- Stripe Free + Starter

### Sprint 7-8 (sem 13-16): IA + segundos casos
- Gemini Vertex AI con BAA
- System prompt + guardrails capas 1-3
- "Subir documento → extraer datos"
- Casos: Eviction defense, LLC formation
- Dropbox Sign
- Dashboard métricas internas

### Pre-aplicación (sem 17-20)
- Auditoría interna contra checklist sec 12.4
- Pen test inicial
- Demo videos
- Documentación legal completa
- Application al Innovation Office

---

## 16. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Rechazo aplicación sandbox | Media | Crítico | Aplicar como Moderate Innovation con abogado supervisor; documentar Utah Innovation Requirement con datos demográficos sólidos; demostrar foco en latinos underserved. |
| Usuario intenta usar para inmigración | Alta | Alto | Filtros multi-capa; bloqueo automático con redirección a recursos federales. |
| IA da asesoría inadvertida | Media | Crítico | System prompt + classifier + flagging humano. |
| Brecha de datos | Baja | Crítico | Encriptación, RLS, pen test, plan respuesta a incidentes, cyber insurance. |
| Audit del Innovation Office encuentra issues | Media | Alto | QA estricto, abogado supervisor revisa muestra mensual, mock audits internos trimestrales. |
| Cambio regulatorio (cierra antes 2027) | Baja | Alto | Plan de transición a operación post-sandbox como puro scrivener service para tareas que no requieran sandbox. |
| Costos IA escalan más rápido que ingresos | Media | Medio | Context caching agresivo, modelos Flash-Lite para tareas simples, límites por tier. |
| Notario fraud copia el modelo | Media | Medio | Branding fuerte, partnerships con orgs latinas locales (Comunidades Unidas, Centro Hispano). |
| Abogado supervisor renuncia | Media | Alto | Contrato 60 días notice; equity retention; identificar 2-3 backups. |
| Audit fees inesperados ($25K+) | Media | Medio | Reservar $30K en fondo de reserva; presupuestar conservadoramente. |

---

## 17. Decisiones Pendientes del Usuario

| # | Decisión | Recomendación |
|---|---|---|
| 1 | Modelo de innovación | **Moderate** (con abogado Utah supervisor). 100% de entidades activas son Moderate. |
| 2 | Estructura legal | LLC simple para MVP. |
| 3 | Vertex AI region | us-central1 (mejor latencia desde Utah). |
| 4 | E-signature | Dropbox Sign (3x más barato que DocuSign). |
| 5 | Marketing | Partnerships con Comunidades Unidas, Centro Hispano de Utah, iglesias católicas/evangélicas latinas Salt Lake/Provo/Ogden. |
| 6 | Incorporación | Utah LLC con registered agent en Salt Lake City. |
| 7 | Abogado supervisor | Buscar abogado Utah con 5+ años en family law, comodidad con tech, fee razonable o equity. |

---

## 18. Verificación y Criterios de Éxito

### 18.1 Cómo verificar cumplimiento sandbox

1. **Auditoría interna mensual** contra checklist sec 12.4.
2. **Pen test anual**.
3. **Audit log review**: muestra aleatoria 100 interacciones IA mensuales — ¿alguna es asesoría?
4. **NPS y CSAT**: encuesta post-caso obligatoria.
5. **Complaint ratio**: target <1 por cada 4,000 servicios.
6. **Validación legal**: revisión trimestral por abogado supervisor de plantillas y outputs.
7. **Mock audits internos** trimestrales que simulen el audit del Innovation Office.

### 18.2 Verificación técnica

```bash
pnpm test              # unit
pnpm test:e2e          # Playwright
pnpm test:a11y         # axe-core
pnpm lint              # ESLint + TS strict

# RLS en todas las tablas
psql -c "SELECT schemaname, tablename, rowsecurity
         FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;"
# Debe retornar 0 filas

# Audit log append-only
psql -c "DELETE FROM audit_log WHERE id=1;"
# Debe fallar

# Guardrails IA
pnpm test:guardrails
# Suite de 50+ prompts maliciosos

# Performance
pnpm lighthouse
# LCP <2.5s, CLS <0.1, FID <100ms

# WCAG 2.2 AA
pnpm pa11y --standard WCAG2AA https://staging.usalatinoprime.com
```

### 18.3 Criterios "ready to apply to sandbox"
- [ ] 100% checklist sec 12.4.
- [ ] 3 casos end-to-end (divorcio, eviction, LLC).
- [ ] Audit log capturando 100% de acciones sensibles.
- [ ] Reporting dashboard genera CSV/PDF.
- [ ] 50+ usuarios beta Utah verificados sin complaint crítico.
- [ ] Abogado supervisor identificado y contratado.
- [ ] Pen test inicial sin vulnerabilidades High/Critical.
- [ ] Cyber insurance contratado.
- [ ] Reserva financiera: $250 + $5,000 + $30K (audit reserve) + 6 meses de salario abogado supervisor.
- [ ] Entidad LLC registrada en Utah con buena posición.
- [ ] Ubicación física en Utah.

---

## 19. Resumen Ejecutivo

**Plataforma web bilingüe (ES/EN) que ayuda a residentes hispanohablantes de Utah a llenar formularios legales NO migratorios (familia uncontested, defensa de desalojo, formación de empresas) usando un wizard guiado y asistencia opcional de IA Gemini, operando bajo el [Utah Office of Legal Services Innovation Sandbox Phase 2](https://utahinnovationoffice.org/info-for-interested-applicants/) como Moderate Innovation con abogado supervisor licenciado en Utah, cumpliendo con: Standing Order No. 15, Rules 11-701/705, prohibición de inmigración (Order 16 sept 2024), Utah Innovation Requirement, audit logs inmutables, complaint system integrado al Innovation Office, fiduciary duties para controlling persons, y compliance UCPA/WCAG.**

**Costos year-1 estimados**: $250 application + $5,000 annual + ~$30K audit reserve + ~$80K abogado supervisor + ~$25K infra/tooling = **~$140K** (excluyendo marketing y salarios fundadores).

**Timeline**: 4-5 meses MVP + 3-9 meses approval = **8-14 meses** desde inicio hasta operación autorizada.

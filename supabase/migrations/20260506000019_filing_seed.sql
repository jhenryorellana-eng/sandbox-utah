-- ============================================================================
-- 20260506000019_filing_seed
-- Datos iniciales para la feature "Radicación por Distrito".
--
-- Fuentes (verificadas mayo 2026):
--   - https://www.utcourts.gov/en/about/courts/dist/overview.html
--   - https://www.utcourts.gov/en/about/miscellaneous/directory/map-of-judicial-districts.html
--   - https://www.utcourts.gov/en/legal-help/legal-help/procedures/fees.html
--   - https://www.utcourts.gov/en/forms/forms/court-forms.html
--   - https://utahinnovationoffice.org/sandbox-customer-complaint/ (UPL/disclosure)
--
-- Las URLs son source-of-truth para imprimir formularios oficiales. Se cachearán
-- on-demand a SHA-256 vía form-cache.ts; los URLs `legacy.utcourts.gov` están
-- mantenidos por la corte (redirects automáticos al CDN nuevo).
-- ============================================================================

-- ============================================================================
-- 1. Catálogo: nuevo servicio small-claims (UCA 78A-8) en categoría business
-- ============================================================================
insert into public.services (
  category_id, slug, name_es, name_en, short_description_es, short_description_en,
  long_description_es, long_description_en,
  what_it_includes_es, what_it_includes_en,
  what_it_does_not_include_es, what_it_does_not_include_en,
  base_price_cents, estimated_duration_minutes, workflow_slug,
  required_documents, beneficiary_label_es, beneficiary_label_en,
  allows_multiple_beneficiaries, is_active, display_order
)
select
  sc.id,
  'small-claims',
  'Reclamos Pequeños (Small Claims)',
  'Small Claims',
  'Demanda de hasta $11,000 en Justice Court — sin abogado requerido.',
  'Up to $11,000 claim filed in Justice Court — no attorney required.',
  'Te ayudamos a preparar la demanda y la citación (Affidavit & Summons 2001SC) para casos de hasta $11,000 contra una persona o negocio. Tú decides demandar; nosotros estructuramos los hechos y los documentos oficiales.',
  'We help you prepare the affidavit and summons (Form 2001SC) for claims up to $11,000 against a person or business. You decide to sue; we structure facts and official documents.',
  '["Affidavit and Summons 2001SC", "Civil Filing Cover Sheet 1044", "Proof of Service 1020GE", "Instrucciones de presentación por distrito"]'::jsonb,
  '["Affidavit and Summons 2001SC", "Civil Filing Cover Sheet 1044", "Proof of Service 1020GE", "Filing instructions per district"]'::jsonb,
  '["Asesoría sobre probabilidad de ganar", "Representación en audiencia", "Apelación"]'::jsonb,
  '["Advice on chances of winning", "Hearing representation", "Appeal"]'::jsonb,
  9900, 60, 'small-claims',
  '[]'::jsonb, null, null,
  false, true, 50
from public.service_categories sc
where sc.slug = 'business'
on conflict (slug) do nothing;

-- ============================================================================
-- 2. Los 8 distritos judiciales
-- ============================================================================
insert into public.judicial_districts (id, name_es, name_en, seat_city, seat_address, phone, website_url, email_filing_supported, notes_es, notes_en) values
  (1, 'Primer Distrito Judicial', 'First Judicial District', 'Logan', '135 N 100 W, Logan, UT 84321', '(435) 750-1300',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/1st.html', false,
   'Cubre Box Elder, Cache y Rich. Sede principal: Cache County Courthouse en Logan.',
   'Covers Box Elder, Cache and Rich. Primary courthouse: Cache County Courthouse in Logan.'),

  (2, 'Segundo Distrito Judicial', 'Second Judicial District', 'Farmington', '800 W State St, Farmington, UT 84025', '(801) 447-3800',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/2nd.html', false,
   'Cubre Davis, Morgan y Weber. Davis County Courthouse es la sede principal.',
   'Covers Davis, Morgan and Weber. Davis County Courthouse is the primary location.'),

  (3, 'Tercer Distrito Judicial', 'Third Judicial District', 'Salt Lake City', '450 S State St, Salt Lake City, UT 84114', '(801) 238-7300',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/3rd.html', true,
   'Cubre Salt Lake, Summit y Tooele. **El 3rd District acepta filing por email** para algunos casos pro se. Es el distrito más grande de Utah.',
   'Covers Salt Lake, Summit and Tooele. **The 3rd District accepts email filing** for some pro se cases. It is the largest district in Utah.'),

  (4, 'Cuarto Distrito Judicial', 'Fourth Judicial District', 'Provo', '137 N Freedom Blvd #100, Provo, UT 84601', '(801) 429-1000',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/4th.html', false,
   'Cubre Juab, Millard, Utah y Wasatch. Sede principal en Provo (Utah County Courthouse).',
   'Covers Juab, Millard, Utah and Wasatch. Primary courthouse in Provo (Utah County Courthouse).'),

  (5, 'Quinto Distrito Judicial', 'Fifth Judicial District', 'St. George', '206 W Tabernacle St, St. George, UT 84770', '(435) 986-5700',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/5th.html', false,
   'Cubre Beaver, Iron y Washington. St. George (Washington County) es la sede más activa.',
   'Covers Beaver, Iron and Washington. St. George (Washington County) is the busiest location.'),

  (6, 'Sexto Distrito Judicial', 'Sixth Judicial District', 'Richfield', '895 E 300 N, Richfield, UT 84701', '(435) 896-2700',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/6th.html', false,
   'Cubre Garfield, Kane, Piute, Sanpete, Sevier y Wayne (rural).',
   'Covers Garfield, Kane, Piute, Sanpete, Sevier and Wayne (rural).'),

  (7, 'Séptimo Distrito Judicial', 'Seventh Judicial District', 'Price', '253 E 400 N, Price, UT 84501', '(435) 636-3300',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/7th.html', false,
   'Cubre Carbon, Emery, Grand y San Juan (este de Utah).',
   'Covers Carbon, Emery, Grand and San Juan (eastern Utah).'),

  (8, 'Octavo Distrito Judicial', 'Eighth Judicial District', 'Roosevelt', '920 E 200 N, Roosevelt, UT 84066', '(435) 722-2493',
   'https://www.utcourts.gov/en/about/courts/dist/dist-sites/8th.html', false,
   'Cubre Daggett, Duchesne y Uintah (cuenca Uinta).',
   'Covers Daggett, Duchesne and Uintah (Uinta basin).');

-- ============================================================================
-- 3. Los 29 condados de Utah → distrito
-- ============================================================================
insert into public.utah_counties (fips_code, name, district_id, has_juvenile_court, has_justice_court) values
  ('49001', 'Beaver',     5, true, true),
  ('49003', 'Box Elder',  1, true, true),
  ('49005', 'Cache',      1, true, true),
  ('49007', 'Carbon',     7, true, true),
  ('49009', 'Daggett',    8, true, true),
  ('49011', 'Davis',      2, true, true),
  ('49013', 'Duchesne',   8, true, true),
  ('49015', 'Emery',      7, true, true),
  ('49017', 'Garfield',   6, true, true),
  ('49019', 'Grand',      7, true, true),
  ('49021', 'Iron',       5, true, true),
  ('49023', 'Juab',       4, true, true),
  ('49025', 'Kane',       6, true, true),
  ('49027', 'Millard',    4, true, true),
  ('49029', 'Morgan',     2, true, true),
  ('49031', 'Piute',      6, true, true),
  ('49033', 'Rich',       1, true, true),
  ('49035', 'Salt Lake',  3, true, true),
  ('49037', 'San Juan',   7, true, true),
  ('49039', 'Sanpete',    6, true, true),
  ('49041', 'Sevier',     6, true, true),
  ('49043', 'Summit',     3, true, true),
  ('49045', 'Tooele',     3, true, true),
  ('49047', 'Uintah',     8, true, true),
  ('49049', 'Utah',       4, true, true),
  ('49051', 'Wasatch',    4, true, true),
  ('49053', 'Washington', 5, true, true),
  ('49055', 'Wayne',      6, true, true),
  ('49057', 'Weber',      2, true, true);

-- ============================================================================
-- 4. Court locations (sedes principales por distrito)
-- ============================================================================
insert into public.court_locations (district_id, county_fips, court_type, name_es, name_en, street, city, zip, phone, hours, website_url, self_help_center_phone) values
  (1, '49005', 'district', 'Cache County Courthouse',     'Cache County Courthouse',     '135 N 100 W',           'Logan',          '84321', '(435) 750-1300', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/1st.html', '(888) 683-0009'),
  (2, '49011', 'district', 'Davis County Courthouse',     'Davis County Courthouse',     '800 W State St',        'Farmington',     '84025', '(801) 447-3800', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/2nd.html', '(888) 683-0009'),
  (2, '49057', 'district', 'Weber County Courthouse',     'Weber County Courthouse',     '2525 Grant Ave',        'Ogden',          '84401', '(801) 395-1077', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/2nd.html', '(888) 683-0009'),
  (3, '49035', 'district', 'Matheson Courthouse',         'Matheson Courthouse',         '450 S State St',        'Salt Lake City', '84114', '(801) 238-7300', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/3rd.html', '(888) 683-0009'),
  (3, '49045', 'district', 'Tooele County Courthouse',    'Tooele County Courthouse',    '74 S 100 E #14',        'Tooele',         '84074', '(435) 833-8000', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/3rd.html', '(888) 683-0009'),
  (4, '49049', 'district', 'Utah County Courthouse',      'Utah County Courthouse',      '137 N Freedom Blvd #100','Provo',         '84601', '(801) 429-1000', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/4th.html', '(888) 683-0009'),
  (5, '49053', 'district', 'Washington County Courthouse','Washington County Courthouse','206 W Tabernacle St',   'St. George',     '84770', '(435) 986-5700', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/5th.html', '(888) 683-0009'),
  (6, '49041', 'district', 'Sevier County Courthouse',    'Sevier County Courthouse',    '895 E 300 N',           'Richfield',      '84701', '(435) 896-2700', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/6th.html', '(888) 683-0009'),
  (7, '49007', 'district', 'Carbon County Courthouse',    'Carbon County Courthouse',    '253 E 400 N',           'Price',          '84501', '(435) 636-3300', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/7th.html', '(888) 683-0009'),
  (8, '49013', 'district', 'Duchesne County Courthouse',  'Duchesne County Courthouse',  '920 E 200 N',           'Roosevelt',      '84066', '(435) 722-2493', 'L-V 8am-5pm', 'https://www.utcourts.gov/en/about/courts/dist/dist-sites/8th.html', '(888) 683-0009');

-- ============================================================================
-- 5. Formularios oficiales
-- ============================================================================
insert into public.official_court_forms (form_code, service_slugs, name_es, name_en, description_es, description_en, url_official, format, is_mandatory, ordering) values
  -- ----- Comunes (todos los servicios) -----
  ('1044', '{uncontested-divorce,eviction-defense,name-change,child-custody,small-claims}',
    'Civil Filing Cover Sheet (1044)', 'Civil Filing Cover Sheet (1044)',
    'Hoja de portada que se presenta con cada demanda civil. Identifica tipo de caso y partes.',
    'Cover sheet filed with every civil case. Identifies case type and parties.',
    'https://www.utcourts.gov/content/dam/resources/forms/civil/Civil_Filing_Cover_Sheet.pdf',
    'pdf', true, 10),

  ('1301GE', '{uncontested-divorce,eviction-defense,name-change,child-custody,small-claims}',
    'Motion to Waive Fees (1301GE)', 'Motion to Waive Fees (1301GE)',
    'Solicitud de exención del costo de presentación si tu ingreso está por debajo del umbral. Incluye declaración financiera.',
    'Request to waive filing fees if income is below threshold. Includes financial statement.',
    'https://legacy.utcourts.gov/resources/forms/waiver/docs/1301GE_Motion_to_Waive_Fees_and_Statement_Supporting.pdf',
    'pdf', false, 90),

  ('1302GE', '{uncontested-divorce,eviction-defense,name-change,child-custody,small-claims}',
    'Order on Motion to Waive Fees (1302GE)', 'Order on Motion to Waive Fees (1302GE)',
    'Orden del juez sobre la solicitud de exención de costos. Se entrega vacía con la solicitud.',
    'Judge''s order on the fee waiver motion. Submitted blank with the motion.',
    'https://legacy.utcourts.gov/resources/forms/waiver/docs/1302GE_Order_on_Motion_to_Waive_Fees.pdf',
    'pdf', false, 91),

  ('1020GE', '{uncontested-divorce,eviction-defense,name-change,child-custody,small-claims}',
    'Proof of Service (1020GE)', 'Proof of Service (1020GE)',
    'Comprobante de que la otra parte recibió la demanda y citación. Obligatorio antes de la audiencia.',
    'Proof that the other party received the complaint and summons. Required before hearing.',
    'https://legacy.utcourts.gov/howto/service/docs/1020GE_Proof_of_Service.pdf',
    'pdf', true, 80),

  -- ----- Divorcio sin disputa -----
  ('1100DR', '{uncontested-divorce}',
    'Domestic Relations Cover Sheet (1100DR)', 'Domestic Relations Cover Sheet (1100DR)',
    'Hoja de portada específica para casos de familia (divorcio, custodia, manutención).',
    'Cover sheet specific to family cases (divorce, custody, support).',
    'https://legacy.utcourts.gov/resources/forms/civil/Domestic_Relations_Cover_Sheet.pdf',
    'pdf', true, 11),

  ('DIVORCE-CHK-CHILDREN', '{uncontested-divorce}',
    'Checklist de divorcio con hijos', 'Divorce checklist with children',
    'Lista de pasos y documentos requeridos cuando hay menores involucrados.',
    'Step-by-step list when minors are involved.',
    'https://www.utcourts.gov/content/dam/howto/family/Divorce%20Checklist%20-%20Children.pdf',
    'pdf', false, 1),

  ('DIVORCE-CHK-NOCHILDREN', '{uncontested-divorce}',
    'Checklist de divorcio sin hijos', 'Divorce checklist without children',
    'Lista de pasos y documentos requeridos cuando no hay menores.',
    'Step-by-step list when there are no minors.',
    'https://www.utcourts.gov/content/dam/howto/family/Divorce%20Checklist%20-%20No%20Children.pdf',
    'pdf', false, 2),

  ('MYPAPERWORK-DIVORCE', '{uncontested-divorce,child-custody}',
    'MyPaperwork (generador oficial de divorcio)', 'MyPaperwork (official divorce generator)',
    'Portal oficial de Utah Courts que genera Petition, Summons, Decree y demás documentos paso a paso. Sucesor de OCAP.',
    'Utah Courts official portal that generates Petition, Summons, Decree and other documents step by step. Successor to OCAP.',
    'https://www.utcourts.gov/en/self-help/services/mycase/mypaperwork.html',
    'mypaperwork', true, 5),

  -- ----- Eviction -----
  ('1001EV', '{eviction-defense}',
    '3-Day Notice to Pay or Vacate (1001EV)', '3-Day Notice to Pay or Vacate (1001EV)',
    'Aviso pre-presentación que el dueño debe entregar al inquilino. NO se presenta en la corte; sólo se anexa después.',
    'Pre-filing notice the landlord must serve to the tenant. NOT filed with court; attached later.',
    'https://legacy.utcourts.gov/howto/landlord/docs/1001EV_3_Day_Notice_to_Pay_or_Vacate.pdf',
    'pdf', false, 1),

  ('1005EV', '{eviction-defense}',
    '3-Day Notice to Comply or Vacate (1005EV)', '3-Day Notice to Comply or Vacate (1005EV)',
    'Aviso de 3 días por incumplimiento de contrato (no monetario).',
    '3-day notice for lease violations (non-monetary).',
    'https://legacy.utcourts.gov/howto/landlord/docs/1005EV_3_Day_Notice_to_Comply_or_Vacate.pdf',
    'pdf', false, 2),

  ('1100EV', '{eviction-defense}',
    'Complaint for Unlawful Detainer (1100EV)', 'Complaint for Unlawful Detainer (1100EV)',
    'Demanda verificada de desalojo. Es el primer documento que se presenta en la corte para iniciar el caso.',
    'Verified eviction complaint. First document filed with court to initiate the case.',
    'https://www.utcourts.gov/content/dam/self-help/forms/eviction/1100EV_Complaint_for_Unlawful_Detainer_(Eviction).pdf',
    'pdf', true, 20),

  ('1105EV', '{eviction-defense}',
    'Summons for Eviction Cases (1105EV)', 'Summons for Eviction Cases (1105EV)',
    'Citación que el clerk emite tras presentar la demanda. Se entrega al inquilino con la demanda.',
    'Summons issued by the clerk after filing the complaint. Served on tenant with the complaint.',
    'https://www.utcourts.gov/content/dam/self-help/forms/eviction/1105EV_Summons_for_Eviction_Cases.pdf',
    'pdf', true, 21),

  ('2100EV', '{eviction-defense}',
    'Tenant Answer & Counterclaim (2100EV)', 'Tenant Answer & Counterclaim (2100EV)',
    'Respuesta del inquilino a la demanda. Defensas afirmativas y contrademanda.',
    'Tenant''s response to the complaint. Affirmative defenses and counterclaim.',
    'https://legacy.utcourts.gov/howto/landlord/docs/2100EV_Tenant_Answer_and_Counterclaim.pdf',
    'pdf', true, 30),

  -- ----- Name change -----
  ('1700FA', '{name-change}',
    'Petition for Name Change (1700FA)', 'Petition for Name Change (1700FA)',
    'Petición de cambio de nombre para adultos.',
    'Adult name change petition.',
    'https://legacy.utcourts.gov/resources/forms/namechange/docs/1700FA_Petition_for_Name_Change.pdf',
    'pdf', true, 20),

  ('1702FA', '{name-change}',
    'Order on Petition for Name Change (1702FA)', 'Order on Petition for Name Change (1702FA)',
    'Orden del juez aprobando el cambio de nombre. Se presenta vacía con la petición.',
    'Judge''s order approving the name change. Filed blank with the petition.',
    'https://legacy.utcourts.gov/resources/forms/namechange/docs/1702FA_Order_on_Petition_for_Name_Change.pdf',
    'pdf', true, 21),

  ('1700JA', '{name-change}',
    'Petition for Minor''s Name Change (1700JA)', 'Petition for Minor''s Name Change (1700JA)',
    'Petición de cambio de nombre para menores. Requiere consentimiento de ambos padres.',
    'Minor name change petition. Requires consent of both parents.',
    'https://legacy.utcourts.gov/resources/forms/namechange/juvenile/docs/01_Petition_for_Minors_Name_Change.pdf',
    'pdf', true, 22),

  ('1723FA', '{name-change}',
    'Order Changing Minor''s Name (1723FA)', 'Order Changing Minor''s Name (1723FA)',
    'Orden del juez aprobando el cambio de nombre del menor.',
    'Judge''s order approving the minor''s name change.',
    'https://legacy.utcourts.gov/resources/forms/namechange/juvenile/docs/1723FA_Order_Changing_Minors_Name.pdf',
    'pdf', true, 23),

  -- ----- Small claims -----
  ('2001SC', '{small-claims}',
    'Affidavit and Summons — Small Claims (2001SC)', 'Affidavit and Summons — Small Claims (2001SC)',
    'Documento combinado: declaración de hechos bajo juramento + citación. Es el ÚNICO documento de inicio para small claims.',
    'Combined document: sworn statement of facts + summons. The ONLY initiating document for small claims.',
    'https://legacy.utcourts.gov/howto/smallclaims/docs/01_Affidavit_and_Summons.pdf',
    'pdf', true, 20),

  ('2003SC', '{small-claims}',
    'Counter Affidavit and Summons (2003SC)', 'Counter Affidavit and Summons (2003SC)',
    'Contrademanda del demandado bajo juramento.',
    'Defendant''s sworn counter-claim.',
    'https://legacy.utcourts.gov/howto/smallclaims/docs/04_Counter_Affidavit_and_Summons.pdf',
    'pdf', true, 30),

  -- ----- Custody (usa MyPaperwork principalmente, además child support worksheet) -----
  ('CUSTODY-CSW', '{child-custody}',
    'Child Support Worksheet (1131FA)', 'Child Support Worksheet (1131FA)',
    'Cálculo de manutención según las directrices estatales.',
    'Child support calculation per state guidelines.',
    'https://www.utcourts.gov/en/self-help/case-categories/family/child-support/calculator.html',
    'html', true, 25);

-- ============================================================================
-- 6. Procedimientos por servicio (statewide)
-- ============================================================================
-- Patrón: 1 fila con district_id NULL = aplica a los 8 distritos. Override con
-- district_id específico sólo cuando hay diferencia real (ej: 3rd District acepta email).
-- ============================================================================

-- ----- uncontested-divorce (statewide) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'uncontested-divorce', null, 'mycase',
  '[
    {"step":1,"title":"Confirmar 3+ meses de residencia en Utah","detail":"Utah Code 30-3-1: el peticionario debe haber residido en Utah por al menos 3 meses antes de presentar.","estimated_time":"Validación inmediata","requires_client_action":true},
    {"step":2,"title":"Generar Petition for Divorce vía MyPaperwork","detail":"Usa el portal oficial de utcourts.gov para generar todos los documentos del caso (sucesor de OCAP).","estimated_time":"30-45 min","requires_client_action":true},
    {"step":3,"title":"Imprimir y firmar la petición ante notario","detail":"Algunos distritos aceptan declaración bajo juramento sin notario; verifica con el self-help center local.","estimated_time":"15 min","requires_client_action":true},
    {"step":4,"title":"Presentar en MyCase o en ventanilla del condado de residencia","detail":"Filing fee $325 (o motion to waive si calificas).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Confirm 3+ months Utah residency","detail":"Utah Code 30-3-1: petitioner must have resided in Utah at least 3 months before filing.","estimated_time":"Immediate validation","requires_client_action":true},
    {"step":2,"title":"Generate Petition for Divorce via MyPaperwork","detail":"Use the official utcourts.gov portal to generate all case documents (successor to OCAP).","estimated_time":"30-45 min","requires_client_action":true},
    {"step":3,"title":"Print and notarize the petition","detail":"Some districts accept a sworn declaration without notary; verify with local self-help center.","estimated_time":"15 min","requires_client_action":true},
    {"step":4,"title":"File in MyCase or in person in your county of residence","detail":"Filing fee $325 (or motion to waive if eligible).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  32500, '1301GE',
  '[
    {"step":1,"title":"Servir al cónyuge (Acceptance of Service o Sheriff)","detail":"El cónyuge tiene 21 días civiles para responder; si firma Acceptance, se acelera.","estimated_time":"3-7 días","requires_client_action":true},
    {"step":2,"title":"Esperar respuesta o aplicar default","detail":"Si no responde dentro de 21 días, presenta Motion for Default Judgment.","estimated_time":"Hasta 21 días","requires_client_action":false},
    {"step":3,"title":"Presentar Findings of Fact y Decree of Divorce propuesto","detail":"El juez los firma normalmente sin audiencia para casos sin disputa.","estimated_time":"2-4 semanas","requires_client_action":true},
    {"step":4,"title":"Recibir Decree firmado y registrar en Vital Records","detail":"Solicita copias certificadas para cualquier trámite posterior (cambio de nombre, beneficios, etc.).","estimated_time":"1-2 semanas","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Serve the spouse (Acceptance of Service or Sheriff)","detail":"Spouse has 21 calendar days to respond; if they sign Acceptance, it speeds up.","estimated_time":"3-7 days","requires_client_action":true},
    {"step":2,"title":"Wait for response or apply default","detail":"If they do not respond within 21 days, file a Motion for Default Judgment.","estimated_time":"Up to 21 days","requires_client_action":false},
    {"step":3,"title":"Submit proposed Findings of Fact and Decree of Divorce","detail":"The judge typically signs them without a hearing for uncontested cases.","estimated_time":"2-4 weeks","requires_client_action":true},
    {"step":4,"title":"Receive signed Decree and register with Vital Records","detail":"Request certified copies for downstream paperwork (name change, benefits, etc.).","estimated_time":"1-2 weeks","requires_client_action":true}
  ]'::jsonb,
  90,
  'Para divorcio, el caso debe presentarse en el condado donde reside cualquiera de los cónyuges (UCA 78B-3a-201 y 78B-15-604).',
  'For divorce, the case must be filed in the county where either spouse resides (UCA 78B-3a-201 and 78B-15-604).',
  '78B-3a-201',
  '["https://www.utcourts.gov/en/self-help/categories/family/divorce.html","https://www.utcourts.gov/en/self-help/services/mycase/mypaperwork.html","https://le.utah.gov/xcode/Title30/Chapter3/30-3-S1.html","https://le.utah.gov/xcode/Title78B/Chapter3A/C78B-3a_2023050320240701.pdf"]'::jsonb
);

-- ----- eviction-defense (statewide) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'eviction-defense', null, 'in_person',
  '[
    {"step":1,"title":"Recibir y guardar el aviso (3-day, 5-day o 15-day)","detail":"Documenta fecha y método de entrega. Si el aviso fue defectuoso, es una defensa válida.","estimated_time":"Inmediato","requires_client_action":true},
    {"step":2,"title":"Buscar asistencia y confirmar el plazo de respuesta","detail":"Tienes 3 días hábiles para responder por escrito ante la corte tras el filing del landlord. Días no incluyen fines de semana.","estimated_time":"Inmediato","requires_client_action":true},
    {"step":3,"title":"Presentar la respuesta (Tenant Answer 2100EV) en la corte del condado de la propiedad","detail":"NO en línea para la mayoría de pro se. Va in-person o por correo certificado.","estimated_time":"30-60 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Receive and keep the notice (3-day, 5-day or 15-day)","detail":"Document date and delivery method. If the notice was defective, it is a valid defense.","estimated_time":"Immediate","requires_client_action":true},
    {"step":2,"title":"Seek assistance and confirm response deadline","detail":"You have 3 business days to file a written response after the landlord''s filing. Days exclude weekends.","estimated_time":"Immediate","requires_client_action":true},
    {"step":3,"title":"File the answer (Tenant Answer 2100EV) in the county where the property is located","detail":"NOT online for most pro se. In-person or certified mail.","estimated_time":"30-60 min","requires_client_action":true}
  ]'::jsonb,
  0, '1301GE',
  '[
    {"step":1,"title":"Asistir a la audiencia de Occupancy Hearing","detail":"Programada típicamente 7-10 días tras tu Answer. Lleva todo: lease, recibos, fotos, mensajes.","estimated_time":"1-2 horas","requires_client_action":true},
    {"step":2,"title":"Si pierdes Occupancy, comparece a Damages Hearing","detail":"Programada 30-60 días después. Aquí se determinan rentas atrasadas, daños y costas.","estimated_time":"1-3 horas","requires_client_action":true},
    {"step":3,"title":"Considerar apelación o acuerdo","detail":"Tienes 30 días para apelar a District Court (trial de novo si la audiencia fue en Justice Court).","estimated_time":"30 días","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Attend the Occupancy Hearing","detail":"Typically scheduled 7-10 days after your Answer. Bring everything: lease, receipts, photos, messages.","estimated_time":"1-2 hours","requires_client_action":true},
    {"step":2,"title":"If you lose Occupancy, attend the Damages Hearing","detail":"Scheduled 30-60 days later. Past-due rent, damages and costs are determined here.","estimated_time":"1-3 hours","requires_client_action":true},
    {"step":3,"title":"Consider appeal or settlement","detail":"You have 30 days to appeal to District Court (trial de novo if the hearing was in Justice Court).","estimated_time":"30 days","requires_client_action":true}
  ]'::jsonb,
  60,
  'Para casos de unlawful detainer (eviction), el caso debe presentarse en el condado donde está ubicada la propiedad arrendada (UCA 78B-3a-202).',
  'For unlawful detainer (eviction) cases, the case must be filed in the county where the rental property is located (UCA 78B-3a-202).',
  '78B-3a-202',
  '["https://www.utcourts.gov/en/self-help/categories/housing/eviction.html","https://www.utcourts.gov/en/self-help/categories/housing/landlord/eviction-landlord.html","https://le.utah.gov/xcode/Title78B/Chapter3A/C78B-3a_2023050320240701.pdf"]'::jsonb
);

-- ----- name-change (statewide) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'name-change', null, 'in_person',
  '[
    {"step":1,"title":"Llenar Petition for Name Change (1700FA o 1700JA si menor)","detail":"Para menores requieres consentimiento notariado de ambos padres.","estimated_time":"30 min","requires_client_action":true},
    {"step":2,"title":"Llenar Order on Petition (1702FA o 1723FA) en blanco","detail":"El juez la firma si aprueba.","estimated_time":"5 min","requires_client_action":true},
    {"step":3,"title":"Presentar en District Court del condado de residencia","detail":"Filing fee aproximadamente $375 (verifica monto exacto al momento de presentar).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Fill out Petition for Name Change (1700FA or 1700JA if minor)","detail":"For minors you need notarized consent from both parents.","estimated_time":"30 min","requires_client_action":true},
    {"step":2,"title":"Fill out Order on Petition (1702FA or 1723FA) blank","detail":"The judge signs it if approved.","estimated_time":"5 min","requires_client_action":true},
    {"step":3,"title":"File in District Court of your county of residence","detail":"Filing fee approximately $375 (verify exact amount at time of filing).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  37500, '1301GE',
  '[
    {"step":1,"title":"Esperar audiencia (si requerida)","detail":"Algunos jueces firman sin audiencia si la petición está completa y nadie objeta.","estimated_time":"4-8 semanas","requires_client_action":false},
    {"step":2,"title":"Recibir orden firmada y obtener copias certificadas","detail":"Necesitarás copias para Social Security, DMV, banco, escuela, etc.","estimated_time":"1-2 semanas","requires_client_action":true},
    {"step":3,"title":"Actualizar documentos de identidad","detail":"Social Security primero, luego Utah DMV (driver license).","estimated_time":"1-3 días","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Wait for hearing (if required)","detail":"Some judges sign without a hearing if the petition is complete and no one objects.","estimated_time":"4-8 weeks","requires_client_action":false},
    {"step":2,"title":"Receive signed order and get certified copies","detail":"You will need copies for Social Security, DMV, bank, school, etc.","estimated_time":"1-2 weeks","requires_client_action":true},
    {"step":3,"title":"Update identification documents","detail":"Social Security first, then Utah DMV (driver license).","estimated_time":"1-3 days","requires_client_action":true}
  ]'::jsonb,
  60,
  'La petición debe presentarse en el condado donde reside el peticionario (Utah Code 42-1-1).',
  'The petition must be filed in the county where the petitioner resides (Utah Code 42-1-1).',
  '42-1-1',
  '["https://www.utcourts.gov/en/self-help/case-categories/family/name-change.html","https://le.utah.gov/xcode/Title42/Chapter1/42-1-S1.html"]'::jsonb
);

-- ----- child-custody (statewide) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'child-custody', null, 'mycase',
  '[
    {"step":1,"title":"Generar Petition for Custody/Parentage en MyPaperwork","detail":"El portal genera Parenting Plan, Child Support Worksheet y demás documentos.","estimated_time":"45-90 min","requires_client_action":true},
    {"step":2,"title":"Calcular manutención usando Child Support Worksheet (1131FA)","detail":"Usa la calculadora oficial; el resultado debe presentarse con la petición.","estimated_time":"20 min","requires_client_action":true},
    {"step":3,"title":"Presentar en District Court del condado del menor","detail":"Filing fee $325. UCCJEA aplica si el menor vivió fuera de Utah en los últimos 6 meses.","estimated_time":"30-45 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Generate Petition for Custody/Parentage in MyPaperwork","detail":"The portal generates Parenting Plan, Child Support Worksheet and other documents.","estimated_time":"45-90 min","requires_client_action":true},
    {"step":2,"title":"Compute support using the Child Support Worksheet (1131FA)","detail":"Use the official calculator; the result must be filed with the petition.","estimated_time":"20 min","requires_client_action":true},
    {"step":3,"title":"File in District Court of the child''s county","detail":"Filing fee $325. UCCJEA applies if the child lived outside Utah within the last 6 months.","estimated_time":"30-45 min","requires_client_action":true}
  ]'::jsonb,
  32500, '1301GE',
  '[
    {"step":1,"title":"Servir al otro padre","detail":"21 días para respuesta (30 si vive fuera de Utah).","estimated_time":"7-14 días","requires_client_action":true},
    {"step":2,"title":"Mediación obligatoria","detail":"Casi todos los condados requieren intentar mediación antes de la audiencia.","estimated_time":"4-8 semanas","requires_client_action":true},
    {"step":3,"title":"Audiencia y orden final","detail":"Si no hay acuerdo, el juez decide tras una audiencia.","estimated_time":"3-6 meses","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Serve the other parent","detail":"21 days to respond (30 if living outside Utah).","estimated_time":"7-14 days","requires_client_action":true},
    {"step":2,"title":"Mandatory mediation","detail":"Almost every county requires mediation attempts before hearing.","estimated_time":"4-8 weeks","requires_client_action":true},
    {"step":3,"title":"Hearing and final order","detail":"If no agreement, the judge decides after a hearing.","estimated_time":"3-6 months","requires_client_action":true}
  ]'::jsonb,
  150,
  'Para custodia, el caso debe presentarse en el condado de residencia del menor (UCCJEA — Utah Code 78B-13).',
  'For custody, the case must be filed in the child''s county of residence (UCCJEA — Utah Code 78B-13).',
  '78B-13-201',
  '["https://www.utcourts.gov/en/self-help/categories/family/child-custody.html","https://le.utah.gov/xcode/Title78B/Chapter13/78B-13.html","https://www.utcourts.gov/en/self-help/case-categories/family/child-support/calculator.html"]'::jsonb
);

-- ----- small-claims (statewide) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'small-claims', null, 'mycase',
  '[
    {"step":1,"title":"Confirmar que el reclamo es ≤ $11,000","detail":"Si excede, debes presentar en District Court con un Civil Complaint regular.","estimated_time":"Inmediato","requires_client_action":true},
    {"step":2,"title":"Llenar Affidavit and Summons (2001SC) bajo juramento","detail":"Este es el documento combinado de demanda + citación para small claims.","estimated_time":"30 min","requires_client_action":true},
    {"step":3,"title":"Presentar en Justice Court del condado del demandado o donde surgió la disputa","detail":"Filing fee escalonado: $60 (≤$2k), $100 ($2k-$7.5k), $185 ($7.5k-$11k).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Confirm the claim is ≤ $11,000","detail":"If higher, you must file in District Court with a regular Civil Complaint.","estimated_time":"Immediate","requires_client_action":true},
    {"step":2,"title":"Fill out Affidavit and Summons (2001SC) under oath","detail":"This is the combined complaint + summons document for small claims.","estimated_time":"30 min","requires_client_action":true},
    {"step":3,"title":"File in Justice Court of the defendant''s county or where the dispute arose","detail":"Tiered filing fee: $60 (≤$2k), $100 ($2k-$7.5k), $185 ($7.5k-$11k).","estimated_time":"30 min","requires_client_action":true}
  ]'::jsonb,
  6000, '1301GE',
  '[
    {"step":1,"title":"Servir al demandado ≥ 30 días antes del trial","detail":"Sheriff o adulto >18 años no involucrado. Filing Proof of Service ≤10 días hábiles.","estimated_time":"7-14 días","requires_client_action":true},
    {"step":2,"title":"Asistir al trial","detail":"Trial corto (15-30 min). El juez decide el mismo día.","estimated_time":"1 hora","requires_client_action":true},
    {"step":3,"title":"Cobrar el judgment (si ganas)","detail":"Si el demandado no paga, tienes que iniciar collection (Wage Garnishment, Writ of Execution).","estimated_time":"variable","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Serve the defendant ≥ 30 days before trial","detail":"Sheriff or non-party adult >18. File Proof of Service within 10 business days.","estimated_time":"7-14 days","requires_client_action":true},
    {"step":2,"title":"Attend the trial","detail":"Short trial (15-30 min). The judge decides the same day.","estimated_time":"1 hour","requires_client_action":true},
    {"step":3,"title":"Collect the judgment (if you win)","detail":"If defendant doesn''t pay, you must start collection (Wage Garnishment, Writ of Execution).","estimated_time":"variable","requires_client_action":true}
  ]'::jsonb,
  90,
  'Para small claims, el caso debe presentarse en el condado donde reside el demandado o donde surgió la disputa (Small Claims Rule 3, Utah Code 78A-8).',
  'For small claims, the case must be filed in the county where the defendant resides or where the dispute arose (Small Claims Rule 3, Utah Code 78A-8).',
  '78A-8-102',
  '["https://www.utcourts.gov/en/self-help/case-categories/consumer/small-claims.html","https://le.utah.gov/xcode/Title78A/Chapter8/C78A-8_1800010118000101.pdf","https://legacy.utcourts.gov/rules/viewall.php?type=srpe"]'::jsonb
);

-- ----- 3rd District override: acepta filing por email (uncontested-divorce) -----
insert into public.case_filing_procedures (
  service_slug, district_id, intake_channel,
  intake_steps_es, intake_steps_en,
  intake_filing_fee_cents, intake_fee_waiver_form_code,
  case_steps_es, case_steps_en,
  case_typical_duration_days,
  venue_rule_es, venue_rule_en, venue_statute_ref,
  source_urls
) values (
  'uncontested-divorce', 3, 'email',
  '[
    {"step":1,"title":"Confirmar 3+ meses de residencia en Utah","detail":"Utah Code 30-3-1.","estimated_time":"Inmediato","requires_client_action":true},
    {"step":2,"title":"Generar Petition for Divorce vía MyPaperwork","detail":"Mismo proceso que statewide.","estimated_time":"30-45 min","requires_client_action":true},
    {"step":3,"title":"Presentar por email al 3rd District (CIVIL_FILING)","detail":"El 3rd District acepta presentación por email para casos pro se. Adjunta PDFs firmados (e-signature aceptable). Verifica el correo más reciente en utcourts.gov/legal-help/legal-help/procedures/filing/email/3rd-district.html",
     "estimated_time":"15 min","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Confirm 3+ months Utah residency","detail":"Utah Code 30-3-1.","estimated_time":"Immediate","requires_client_action":true},
    {"step":2,"title":"Generate Petition for Divorce via MyPaperwork","detail":"Same process as statewide.","estimated_time":"30-45 min","requires_client_action":true},
    {"step":3,"title":"File by email to the 3rd District (CIVIL_FILING)","detail":"The 3rd District accepts email filing for pro se. Attach signed PDFs (e-signature acceptable). Verify the latest email at utcourts.gov/legal-help/legal-help/procedures/filing/email/3rd-district.html",
     "estimated_time":"15 min","requires_client_action":true}
  ]'::jsonb,
  32500, '1301GE',
  '[
    {"step":1,"title":"Recibir confirmación del clerk","detail":"Por email; conserva el case number.","estimated_time":"1-3 días hábiles","requires_client_action":false},
    {"step":2,"title":"Servir al cónyuge","detail":"Igual que statewide.","estimated_time":"3-7 días","requires_client_action":true},
    {"step":3,"title":"Decree firmado por el juez","detail":"Puede tomar 4-8 semanas tras default.","estimated_time":"4-8 semanas","requires_client_action":true}
  ]'::jsonb,
  '[
    {"step":1,"title":"Receive clerk confirmation","detail":"By email; keep the case number.","estimated_time":"1-3 business days","requires_client_action":false},
    {"step":2,"title":"Serve the spouse","detail":"Same as statewide.","estimated_time":"3-7 days","requires_client_action":true},
    {"step":3,"title":"Decree signed by the judge","detail":"May take 4-8 weeks after default.","estimated_time":"4-8 weeks","requires_client_action":true}
  ]'::jsonb,
  75,
  'Salt Lake, Summit y Tooele. El demandante puede presentar en cualquiera de los 3 condados si reside en el distrito (UCA 78B-3a-201).',
  'Salt Lake, Summit and Tooele. The petitioner may file in any of the 3 counties if residing in the district (UCA 78B-3a-201).',
  '78B-3a-201',
  '["https://www.utcourts.gov/en/legal-help/legal-help/procedures/filing/email/3rd-district.html","https://www.utcourts.gov/en/self-help/categories/family/divorce.html"]'::jsonb
);

-- ============================================================================
-- 20260502000010_seed_catalog
-- Datos iniciales del catálogo: 3 categorías + 12 servicios MVP.
-- Idempotente (ON CONFLICT DO NOTHING).
-- ============================================================================

insert into public.service_categories (slug, name_es, name_en, description_es, description_en, icon, color_hex, display_order)
values
  (
    'family',
    'Familia',
    'Family',
    'Trámites familiares sin disputa: divorcio, custodia, cambio de nombre, guardianship.',
    'Uncontested family matters: divorce, custody, name change, guardianship.',
    'users',
    '#9B59B6',
    1
  ),
  (
    'housing',
    'Vivienda',
    'Housing',
    'Defensa contra desalojo y derechos del inquilino.',
    'Eviction defense and tenant rights.',
    'home',
    '#3498DB',
    2
  ),
  (
    'business',
    'Empresarial',
    'Business',
    'Formación de empresas: LLC, DBA, acuerdos operativos y de contratistas.',
    'Business formation: LLC, DBA, operating and contractor agreements.',
    'briefcase',
    '#27AE60',
    3
  )
on conflict (slug) do nothing;

-- Servicios — los workflow_slug y pdf_template_path son placeholders hasta Sprint 5-6.
insert into public.services (
  category_id, slug, name_es, name_en, short_description_es, short_description_en,
  what_it_includes_es, what_it_includes_en, what_it_does_not_include_es, what_it_does_not_include_en,
  base_price_cents, estimated_duration_minutes, workflow_slug, beneficiary_label_es, beneficiary_label_en,
  allows_multiple_beneficiaries, display_order
)
select
  c.id, v.slug, v.name_es, v.name_en, v.short_description_es, v.short_description_en,
  v.what_it_includes_es::jsonb, v.what_it_includes_en::jsonb,
  v.what_it_does_not_include_es::jsonb, v.what_it_does_not_include_en::jsonb,
  v.base_price_cents, v.estimated_duration_minutes, v.workflow_slug,
  v.beneficiary_label_es, v.beneficiary_label_en, v.allows_multiple_beneficiaries, v.display_order
from public.service_categories c
join (values
  -- Familia
  ('family', 'uncontested-divorce', 'Divorcio sin disputa', 'Uncontested Divorce',
   'Llenado de petición de divorcio cuando ambos cónyuges están de acuerdo.',
   'Filing the divorce petition when both spouses agree.',
   '["Petición y respuesta", "Acuerdo de propiedad", "Plan de crianza si hay hijos"]',
   '["Petition and answer", "Property settlement", "Parenting plan if children"]',
   '["Disputas contestadas", "Apelaciones", "Asesoría legal personalizada"]',
   '["Contested disputes", "Appeals", "Personalized legal advice"]',
   29900, 90, 'uncontested-divorce', null, null, false, 1),
  ('family', 'child-custody', 'Custodia de menores', 'Child Custody',
   'Petición o modificación de custodia sin disputa.',
   'Uncontested custody petition or modification.',
   '["Petición de custodia", "Plan de crianza"]',
   '["Custody petition", "Parenting plan"]',
   '["Casos contestados", "Casos con DCFS involucrado"]',
   '["Contested cases", "Cases with DCFS involvement"]',
   24900, 75, 'child-custody', 'menor', 'minor', true, 2),
  ('family', 'name-change', 'Cambio de nombre', 'Name Change',
   'Petición legal de cambio de nombre para adultos o menores.',
   'Legal name change petition for adults or minors.',
   '["Petición", "Aviso de publicación"]',
   '["Petition", "Publication notice"]',
   '["Cambios para evadir deudas o procesos legales"]',
   '["Changes to evade debts or legal proceedings"]',
   14900, 45, 'name-change', null, null, false, 3),
  ('family', 'guardianship', 'Guardianship', 'Guardianship',
   'Tutela legal de un menor o adulto incapacitado.',
   'Legal guardianship of a minor or incapacitated adult.',
   '["Petición de guardianship", "Documentos de notificación"]',
   '["Guardianship petition", "Notice documents"]',
   '["Adopciones", "Casos contestados"]',
   '["Adoptions", "Contested cases"]',
   34900, 90, 'guardianship', 'menor o adulto', 'minor or adult', true, 4),
  ('family', 'power-of-attorney', 'Power of Attorney', 'Power of Attorney',
   'Poder notarial general o limitado.',
   'General or limited power of attorney.',
   '["Documento POA", "Instrucciones de firma"]',
   '["POA document", "Signing instructions"]',
   '["Asesoría sobre alcance de poderes"]',
   '["Advice on scope of powers"]',
   9900, 30, 'power-of-attorney', null, null, false, 5),
  -- Vivienda
  ('housing', 'eviction-defense', 'Defensa de desalojo', 'Eviction Defense',
   'Respuesta y defensa contra demanda de desalojo (3-day, 14-day notice).',
   'Answer and defense against eviction lawsuit (3-day, 14-day notice).',
   '["Answer to complaint", "Affirmative defenses"]',
   '["Answer to complaint", "Affirmative defenses"]',
   '["Apelaciones post-juicio"]',
   '["Post-judgment appeals"]',
   19900, 60, 'eviction-defense', null, null, false, 1),
  ('housing', 'tenant-rights-letter', 'Carta de derechos del inquilino', 'Tenant Rights Letter',
   'Carta formal al landlord exigiendo reparaciones, devolución de depósito, etc.',
   'Formal letter to landlord demanding repairs, deposit return, etc.',
   '["Carta formal", "Cita de Utah Code"]',
   '["Formal letter", "Utah Code citation"]',
   '["Litigio en corte"]',
   '["Court litigation"]',
   9900, 30, 'tenant-rights-letter', null, null, false, 2),
  -- Empresarial
  ('business', 'llc-formation', 'Formación de LLC', 'LLC Formation',
   'Constitución de Limited Liability Company en Utah.',
   'Limited Liability Company formation in Utah.',
   '["Articles of Organization", "Registered Agent guidance", "EIN application info"]',
   '["Articles of Organization", "Registered Agent guidance", "EIN application info"]',
   '["Tax filing", "Operating agreement (separado)"]',
   '["Tax filing", "Operating agreement (separate)"]',
   24900, 60, 'llc-formation', 'empresa', 'company', true, 1),
  ('business', 'dba', 'DBA (Doing Business As)', 'DBA (Doing Business As)',
   'Registro de nombre comercial alternativo.',
   'Registration of alternate business name.',
   '["Registration form", "Filing instructions"]',
   '["Registration form", "Filing instructions"]',
   '["Trademark protection"]',
   '["Trademark protection"]',
   12900, 30, 'dba', 'nombre comercial', 'business name', true, 2),
  ('business', 'operating-agreement', 'Operating Agreement', 'Operating Agreement',
   'Acuerdo operativo para LLC con uno o múltiples miembros.',
   'Operating agreement for single- or multi-member LLC.',
   '["Documento personalizable", "Cláusulas estándar Utah"]',
   '["Customizable document", "Standard Utah clauses"]',
   '["Asesoría sobre estructura óptima"]',
   '["Advice on optimal structure"]',
   19900, 60, 'operating-agreement', 'empresa', 'company', false, 3),
  ('business', 'contractor-agreement', 'Contractor Agreement', 'Contractor Agreement',
   'Contrato independiente contractor / freelance.',
   'Independent contractor / freelance agreement.',
   '["Contrato bilingüe", "Cláusulas IP y NDA básicas"]',
   '["Bilingual contract", "Basic IP and NDA clauses"]',
   '["Negociación con la otra parte"]',
   '["Negotiation with the other party"]',
   14900, 45, 'contractor-agreement', null, null, false, 4)
) as v(category_slug, slug, name_es, name_en, short_description_es, short_description_en,
       what_it_includes_es, what_it_includes_en, what_it_does_not_include_es, what_it_does_not_include_en,
       base_price_cents, estimated_duration_minutes, workflow_slug,
       beneficiary_label_es, beneficiary_label_en, allows_multiple_beneficiaries, display_order)
  on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Document types iniciales (mínimo necesario en Sprint 3-4)
insert into public.document_types (slug, name_es, name_en, applicable_services, is_required_default)
values
  ('utah-driver-license', 'Licencia de conducir Utah', 'Utah Driver License', '{}', false),
  ('utah-state-id', 'ID estatal Utah', 'Utah State ID', '{}', false),
  ('proof-of-residency', 'Comprobante de domicilio', 'Proof of Residency', '{}', false)
on conflict (slug) do nothing;

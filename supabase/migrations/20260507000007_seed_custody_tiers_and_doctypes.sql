-- ============================================================================
-- 20260507000007_seed_custody_tiers_and_doctypes
-- Seed tiers de child-custody (1=$350, 2=$500, 3=$650, 4=$800) y document_types
-- específicos: per-menor (acta nacimiento, pasaporte, ID menor) + generales
-- (ID tutor, lease, recibos servicios, ingresos, ID testigos, otros, evidencias).
-- ============================================================================

do $$
declare
  custody_id uuid;
begin
  select id into custody_id from public.services where slug = 'child-custody';
  if custody_id is null then
    raise notice 'Servicio child-custody no encontrado; saltando seed de tiers';
    return;
  end if;

  insert into public.service_tiers (
    service_id, beneficiaries_count, price_cents,
    label_es, label_en,
    description_es, description_en,
    display_order
  ) values
    (custody_id, 1, 35000,
     'Custodia 1 hijo', 'Custody 1 child',
     'Plan para custodia de un (1) menor.',
     'Plan for custody of one (1) minor.', 1),
    (custody_id, 2, 50000,
     'Custodia 2 hijos', 'Custody 2 children',
     'Plan para custodia de dos (2) menores. Ahorra $200 vs. plan individual.',
     'Plan for custody of two (2) minors. Save $200 vs. single plan.', 2),
    (custody_id, 3, 65000,
     'Custodia 3 hijos', 'Custody 3 children',
     'Plan para custodia de tres (3) menores. Ahorra $400 vs. plan individual.',
     'Plan for custody of three (3) minors. Save $400 vs. single plan.', 3),
    (custody_id, 4, 80000,
     'Custodia 4 hijos', 'Custody 4 children',
     'Plan para custodia de cuatro (4) menores.',
     'Plan for custody of four (4) minors.', 4)
  on conflict (service_id, beneficiaries_count) do nothing;

  update public.services
    set beneficiary_label_es = coalesce(beneficiary_label_es, 'menor'),
        beneficiary_label_en = coalesce(beneficiary_label_en, 'minor')
    where id = custody_id;
end;
$$;

insert into public.document_types (
  slug, name_es, name_en,
  description_es, description_en,
  applicable_services, is_required_default,
  is_per_minor, slot_kind, extraction_schema_slug
) values
  ('child-custody.minor.birth_certificate',
   'Acta de nacimiento del menor', 'Minor birth certificate',
   'Acta o certificado de nacimiento original del menor.',
   'Original birth certificate of the minor.',
   array['child-custody'], true, true, 'single', 'birth_certificate'),
  ('child-custody.minor.passport',
   'Pasaporte del menor', 'Minor passport',
   'Pasaporte vigente del menor (todas las páginas con datos).',
   'Valid passport of the minor (all pages with data).',
   array['child-custody'], true, true, 'single', 'passport'),
  ('child-custody.minor.id',
   'Identificación del menor', 'Minor identification',
   'Cualquier ID adicional del menor (cédula, escolar, etc.).',
   'Any additional ID of the minor (national, school, etc.).',
   array['child-custody'], false, true, 'multiple_named', 'passport'),
  ('child-custody.guardian.id',
   'ID del tutor/custodio', 'Guardian ID',
   'Identificación oficial vigente del tutor o custodio.',
   'Valid official ID of the guardian or custodian.',
   array['child-custody'], true, false, 'single', 'id_guardian'),
  ('child-custody.guardian.lease',
   'Contrato de arrendamiento (lease)', 'Lease agreement',
   'Contrato de arrendamiento o prueba de propiedad de la vivienda.',
   'Lease agreement or proof of home ownership.',
   array['child-custody'], true, false, 'single', 'lease'),
  ('child-custody.guardian.utility_bills',
   'Recibos de servicios públicos', 'Utility bills',
   'Recibos recientes de luz/agua/gas/internet a nombre del custodio.',
   'Recent utility bills (electricity, water, gas, internet) under custodian name.',
   array['child-custody'], true, false, 'multiple_named', 'utility_bill'),
  ('child-custody.guardian.income_proof',
   'Comprobante de ingresos del custodio', 'Custodian income proof',
   'Comprobantes de ingresos del custodio (talones de pago, declaraciones de impuestos, etc.).',
   'Custodian income proof (paystubs, tax returns, etc.).',
   array['child-custody'], true, false, 'multiple_named', 'income_proof'),
  ('child-custody.guardian.other',
   'Otros documentos del tutor', 'Other guardian documents',
   'Otros documentos relevantes del tutor (estados de cuenta, cartas de empleador, etc.).',
   'Other relevant guardian documents (bank statements, employer letters, etc.).',
   array['child-custody'], false, false, 'multiple_named', null),
  ('child-custody.witness.id',
   'ID de testigos', 'Witness ID',
   'Identificaciones oficiales de los testigos que apoyan la solicitud.',
   'Official IDs of witnesses supporting the petition.',
   array['child-custody'], false, false, 'multiple_named', 'witness_id'),
  ('child-custody.evidence',
   'Evidencias', 'Evidence',
   'Fotos, videos, mensajes, registros médicos/escolares u otra evidencia documental.',
   'Photos, videos, messages, medical/school records or other documentary evidence.',
   array['child-custody'], false, false, 'multiple_named', null)
on conflict (slug) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  description_es = excluded.description_es,
  description_en = excluded.description_en,
  applicable_services = excluded.applicable_services,
  is_required_default = excluded.is_required_default,
  is_per_minor = excluded.is_per_minor,
  slot_kind = excluded.slot_kind,
  extraction_schema_slug = excluded.extraction_schema_slug;

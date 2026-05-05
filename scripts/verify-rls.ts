/**
 * verify-rls.ts
 *
 * CI gate: valida que la base de datos cumple con las garantías de auditoría
 * requeridas por el sandbox. Falla con exit code != 0 si:
 *
 *   1. Alguna tabla en `public` schema no tiene RLS habilitado.
 *   2. La tabla `audit_log` no tiene las RULES no-update / no-delete.
 *   3. La tabla `consents` no tiene las RULES no-update / no-delete.
 *
 * Requiere DATABASE_URL apuntando a una DB con migraciones aplicadas.
 *
 * Uso local:
 *   pnpm db:start
 *   DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres pnpm verify:rls
 */
import { Client } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("DATABASE_URL is required")
  process.exit(64)
}

const client = new Client({ connectionString: databaseUrl })

async function main() {
  await client.connect()

  // 1) RLS habilitado en TODAS las tablas de public
  const { rows: noRls } = await client.query<{ tablename: string }>(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = false
  `)
  if (noRls.length > 0) {
    console.error(`❌ RLS NOT enabled on tables: ${noRls.map((r) => r.tablename).join(", ")}`)
    process.exit(1)
  }

  // 2) audit_log tiene rules no-update y no-delete
  const { rows: auditRules } = await client.query<{ rulename: string }>(`
    select rulename
    from pg_rules
    where schemaname = 'public' and tablename = 'audit_log'
  `)
  const auditNames = new Set(auditRules.map((r) => r.rulename))
  for (const required of ["audit_log_no_update", "audit_log_no_delete"]) {
    if (!auditNames.has(required)) {
      console.error(`❌ audit_log missing rule '${required}'`)
      process.exit(2)
    }
  }

  // 3) consents tiene rules no-update y no-delete
  const { rows: consentRules } = await client.query<{ rulename: string }>(`
    select rulename
    from pg_rules
    where schemaname = 'public' and tablename = 'consents'
  `)
  const consentNames = new Set(consentRules.map((r) => r.rulename))
  for (const required of ["consents_no_update", "consents_no_delete"]) {
    if (!consentNames.has(required)) {
      console.error(`❌ consents missing rule '${required}'`)
      process.exit(3)
    }
  }

  // 4) audit_log no debe tener UPDATE/DELETE grants para authenticated/anon
  const { rows: grants } = await client.query<{ grantee: string; privilege_type: string }>(`
    select grantee, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'audit_log'
      and grantee in ('authenticated', 'anon')
      and privilege_type in ('UPDATE', 'DELETE')
  `)
  if (grants.length > 0) {
    console.error(
      `❌ audit_log has forbidden grants: ${grants
        .map((g) => `${g.grantee}:${g.privilege_type}`)
        .join(", ")}`,
    )
    process.exit(4)
  }

  // 5) Tablas esperadas (Sprint 1-2 + 3-4 + 5-6)
  const expectedTables = [
    "profiles",
    "user_roles",
    "audit_log",
    "consents",
    "service_categories",
    "services",
    "document_types",
    "identity_verifications",
    "notifications",
    "cases",
    "case_activities",
    "contracts",
    "payment_plans",
    "installments",
    "payments",
    "payment_proofs",
    "payment_receipts",
    "documents",
  ]
  const { rows: existing } = await client.query<{ tablename: string }>(`
    select tablename from pg_tables where schemaname='public'
  `)
  const present = new Set(existing.map((r) => r.tablename))
  for (const expected of expectedTables) {
    if (!present.has(expected)) {
      console.error(`❌ Expected table public.${expected} missing`)
      process.exit(5)
    }
  }

  // 6) Sprint 5-6: RULES adicionales en case_activities y payment_receipts
  for (const table of ["case_activities", "payment_receipts"]) {
    const { rows } = await client.query<{ rulename: string }>(
      "select rulename from pg_rules where schemaname='public' and tablename=$1",
      [table],
    )
    const names = new Set(rows.map((r) => r.rulename))
    if (!names.has(`${table}_no_update`) || !names.has(`${table}_no_delete`)) {
      console.error(`❌ ${table} missing append-only RULES`)
      process.exit(6)
    }
  }

  console.log("✅ RLS OK on all public tables")
  console.log("✅ audit_log + consents have append-only RULES")
  console.log("✅ audit_log has no UPDATE/DELETE grants for authenticated/anon")
  console.log(`✅ All ${expectedTables.length} expected tables present`)
  await client.end()
}

main().catch(async (err) => {
  console.error("Unexpected error:", err)
  await client.end()
  process.exit(99)
})

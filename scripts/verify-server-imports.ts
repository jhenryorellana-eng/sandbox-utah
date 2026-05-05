/**
 * verify-server-imports.ts
 *
 * Reemplaza el `noRestrictedImports` lint rule (no soportado en Biome 2.4).
 *
 * Garantiza que NINGÚN archivo en `src/server/**` o `src/app/**\/route.ts`
 * importa el browser Supabase client (`@/lib/supabase/client`). Si se viola,
 * el cliente de browser termina ejecutándose server-side sin context de
 * cookies → reads RLS-denied silenciosos. Esta es una invariante crítica.
 *
 * Exit code != 0 si hay violaciones.
 */
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

const FORBIDDEN = "@/lib/supabase/client"

const SERVER_ROOTS = [path.resolve("src/server")]
const APP_ROOT = path.resolve("src/app")

async function* walkTs(dir: string): AsyncGenerator<string> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry)
    const stats = await stat(full)
    if (stats.isDirectory()) {
      yield* walkTs(full)
    } else if (/\.tsx?$/.test(entry)) {
      yield full
    }
  }
}

async function checkFile(file: string): Promise<boolean> {
  const content = await readFile(file, "utf-8")
  return content.includes(FORBIDDEN)
}

async function main() {
  const violations: string[] = []

  for (const root of SERVER_ROOTS) {
    for await (const file of walkTs(root)) {
      if (await checkFile(file)) violations.push(path.relative(process.cwd(), file))
    }
  }

  for await (const file of walkTs(APP_ROOT)) {
    if (/[\\/]route\.tsx?$/.test(file) && (await checkFile(file))) {
      violations.push(path.relative(process.cwd(), file))
    }
  }

  if (violations.length > 0) {
    console.error(`❌ Forbidden import "${FORBIDDEN}" in server files:`)
    for (const v of violations) console.error(`  - ${v}`)
    console.error("\nUse @/lib/supabase/server (createServerClient) instead.")
    process.exit(1)
  }

  console.log(`✅ No forbidden imports of ${FORBIDDEN} in server files`)
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(99)
})

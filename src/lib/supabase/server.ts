import "server-only"
import { createServerClient as createSsrClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/shared/types/database"

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Lee/escribe cookies con `next/headers`. En RSC los writes pueden fallar si la
 * llamada se hace fuera del flujo de cookies — en ese caso el middleware
 * refresca la session en el siguiente request.
 */
export async function createServerClient() {
  const store = await cookies()
  return createSsrClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) {
              store.set(name, value, options)
            }
          } catch {
            // Llamado desde RSC sin cookies mutables. Middleware refresca después.
          }
        },
      },
    },
  )
}

/**
 * Cliente con SERVICE_ROLE para operaciones server-only que deben bypasear RLS
 * (audit log writes, admin scripts). Nunca exponer al cliente.
 */
export function createServiceClient() {
  return createSsrClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

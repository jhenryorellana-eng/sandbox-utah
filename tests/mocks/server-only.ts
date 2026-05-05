// Mock para "server-only" en entorno de test (jsdom). En runtime real, "server-only"
// es un módulo de Next.js que falla la build si se importa desde un componente
// client. En tests no aplica esa garantía — solo necesitamos que el import resuelva.
export {}

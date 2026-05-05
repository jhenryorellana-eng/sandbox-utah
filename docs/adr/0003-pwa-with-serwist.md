# ADR-0003: PWA con @serwist/next y política PII-safe offline

- **Status**: Accepted
- **Date**: 2026-05-02

## Contexto

La comunidad latina en Utah incluye usuarios con conexión irregular (zonas
rurales, planes pre-pago). Una PWA installable mejora retención (icon en home
screen, soporte offline parcial). Pero la app maneja PII bajo el sandbox —
cachear datos sensibles offline crea riesgo legal: si pierde el dispositivo,
los datos quedan accesibles.

`next-pwa` (clásico de Next 13/14) ya no se mantiene activamente para Next.js
15/16. `@serwist/next` es el sucesor activo, basado en Workbox 7, con soporte
oficial para App Router.

## Decisión

Adoptar `@serwist/next 9.5.x` para el service worker con esta **política PII
offline**:

1. **NO se cachea** ningún request a `/api/*` ni `/auth/*` (handler es
   `defaultCache` de Serwist, que excluye estas rutas; verificado con tests).
2. **NO se cachea** datos previos del usuario fetcheados de Supabase. La caché
   alcanza solo: assets estáticos (CSS/JS/fonts/imágenes), navegación a páginas
   públicas, y la página `/{locale}/offline` como fallback de documento.
3. **Borradores de formularios offline** (sprints 5-6, no este sprint) viven en
   IndexedDB local. El SW no los gestiona — la app los escribe directamente
   con datos que el usuario tipea, nunca con datos pre-llenados desde el
   server.
4. Service Worker disabled en `NODE_ENV=development` (sino HMR rompe).

Manifest (`src/app/manifest.ts`) declara `start_url: /es`, `display: standalone`,
3 iconos PNG (192, 512, 512-maskable), apple-touch-icon 180×180.

## Consecuencias

- ✅ App installable (iOS Safari 16.4+ y Chrome/Edge desktop+mobile).
- ✅ Carga rápida tras primera visita (assets en cache).
- ✅ Página offline localizada (`/es/offline`, `/en/offline`).
- ✅ PII nunca aterriza en CacheStorage del navegador — riesgo legal acotado.
- ❌ Modo offline más limitado que apps que cachean dashboards. Trade-off
   consciente y documentado en privacy policy.
- ❌ iOS sin `beforeinstallprompt` — instalación es manual ("Compartir → Añadir
   a inicio"). Plan: tutorial visual en Sprint 3-4.

## Alternativas consideradas

- **next-pwa**: rechazado, mantenimiento estancado.
- **Service Worker nativo manual**: rechazado, demasiado boilerplate Workbox.
- **Offline completo con encriptación libsodium**: rechazado por superficie de
   ataque y complejidad de gestión de claves para usuarios no técnicos.

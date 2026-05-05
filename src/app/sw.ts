/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  cacheId: "uslp-v1",
  // Política PII offline: defaultCache de @serwist/next aplica NetworkFirst a navegación,
  // y SWR a estáticos. NO añadimos caching a /api/* ni /auth/* — Serwist los excluye por
  // defecto, así que los requests pasan a la red sin guardar PII en cache.
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

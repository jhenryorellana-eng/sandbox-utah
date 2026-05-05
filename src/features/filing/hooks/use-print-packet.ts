"use client"

import { useCallback, useState } from "react"
import type { PrintScope } from "../schemas/packet-schema"

export interface UsePrintPacketState {
  printing: boolean
  lastError: string | null
}

export interface UsePrintPacketHandlers {
  print: (args: { scope: PrintScope; formCode?: string }) => Promise<void>
}

export function usePrintPacket(
  caseId: string,
  locale: "es" | "en",
): [UsePrintPacketState, UsePrintPacketHandlers] {
  const [state, setState] = useState<UsePrintPacketState>({ printing: false, lastError: null })

  const print = useCallback<UsePrintPacketHandlers["print"]>(
    async ({ scope, formCode }) => {
      setState({ printing: true, lastError: null })
      try {
        const res = await fetch(`/api/cases/${caseId}/filing/print`, {
          method: "POST",
          headers: { "content-type": "application/json", "accept-language": locale },
          body: JSON.stringify({ scope, formCode }),
        })
        if (!res.ok) {
          let message = `HTTP ${res.status}`
          try {
            const data = (await res.json()) as { error?: string }
            if (data.error) message = data.error
          } catch {
            /* noop */
          }
          setState({ printing: false, lastError: message })
          return
        }
        const blob = await res.blob()
        const filename =
          res.headers.get("content-disposition")?.match(/filename="?([^";]+)"?/)?.[1] ??
          `filing-packet-${caseId}.pdf`
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.append(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 5_000)
        setState({ printing: false, lastError: null })
      } catch (err) {
        setState({
          printing: false,
          lastError: err instanceof Error ? err.message : "unknown_error",
        })
      }
    },
    [caseId, locale],
  )

  return [state, { print }]
}

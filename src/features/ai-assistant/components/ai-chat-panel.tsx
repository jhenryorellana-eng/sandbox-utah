"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { chatWithAssistantAction } from "../actions/chat"

interface ChatMessage {
  id: string
  role: "user" | "model"
  text: string
  blocked?: boolean
}

export function AiChatPanel({ caseId }: { caseId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function send() {
    const message = draft.trim()
    if (!message) return
    setError(null)
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      text: message,
    }
    const next: ChatMessage[] = [...messages, userMsg]
    setMessages(next)
    setDraft("")
    startTransition(async () => {
      const res = await chatWithAssistantAction({
        ...(caseId ? { caseId } : {}),
        message,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
      })
      if (!res.ok) {
        setError(res.errorMessage ?? "Error")
        return
      }
      setMessages([
        ...next,
        {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: "model",
          text: res.text ?? "",
          blocked: res.blocked ?? false,
        },
      ])
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">Asistente IA (Gemini)</p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
          ⚠ NO da asesoría legal
        </span>
      </div>

      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-md bg-secondary/30 p-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Pregúntame cómo llenar un campo del formulario. NO interpreto leyes ni manejo
            inmigración.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-md px-3 py-2 ${
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                : m.blocked
                  ? "max-w-[85%] bg-amber-50 text-amber-900"
                  : "max-w-[85%] bg-background text-foreground"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="Escribe tu pregunta sobre el formulario..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          disabled={pending}
        />
        <Button type="button" onClick={send} disabled={pending || !draft.trim()}>
          {pending ? "..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}

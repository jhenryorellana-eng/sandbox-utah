"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface MinorInput {
  fullName: string
  dateOfBirth: string | null
  documentNumber: string | null
}

export function emptyMinor(): MinorInput {
  return { fullName: "", dateOfBirth: null, documentNumber: null }
}

export function ensureMinorsLength(current: MinorInput[], targetCount: number): MinorInput[] {
  if (targetCount <= 0) return []
  if (current.length === targetCount) return current
  if (current.length < targetCount) {
    const added: MinorInput[] = []
    for (let i = 0; i < targetCount - current.length; i++) added.push(emptyMinor())
    return [...current, ...added]
  }
  return current.slice(0, targetCount)
}

interface MinorListEditorProps {
  minors: MinorInput[]
  onChange: (next: MinorInput[]) => void
  beneficiaryLabel: string
}

export function MinorListEditor({ minors, onChange, beneficiaryLabel }: MinorListEditorProps) {
  function update(index: number, partial: Partial<MinorInput>) {
    onChange(minors.map((m, i) => (i === index ? { ...m, ...partial } : m)))
  }

  return (
    <div className="space-y-3">
      {minors.map((minor, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: order is fixed by tier selection; minors[i] is positional
          key={`minor-${i}`}
          className="rounded-lg border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            {beneficiaryLabel} {i + 1}
          </p>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor={`minor-${i}-name`}>Nombre completo</Label>
              <Input
                id={`minor-${i}-name`}
                value={minor.fullName}
                onChange={(e) => update(i, { fullName: e.target.value })}
                placeholder="Como aparece en la partida de nacimiento"
                required
                minLength={2}
              />
            </div>
            <div>
              <Label htmlFor={`minor-${i}-dob`}>Fecha de nacimiento</Label>
              <Input
                id={`minor-${i}-dob`}
                type="date"
                value={minor.dateOfBirth ?? ""}
                onChange={(e) =>
                  update(i, { dateOfBirth: e.target.value === "" ? null : e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={`minor-${i}-doc`}>Pasaporte / cédula (opcional)</Label>
              <Input
                id={`minor-${i}-doc`}
                value={minor.documentNumber ?? ""}
                onChange={(e) =>
                  update(i, { documentNumber: e.target.value === "" ? null : e.target.value })
                }
                placeholder="Si lo tienes a la mano"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

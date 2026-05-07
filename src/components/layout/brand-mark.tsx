import { FileCheck2, Landmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_14px_32px_oklch(0.31_0.101_257_/_25%)]">
        <Landmark className="size-5" aria-hidden />
        <FileCheck2 className="absolute -right-1 -bottom-1 size-4 rounded bg-accent p-0.5 text-accent-foreground" />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-[0.95rem] font-black tracking-normal text-foreground">
            USA Latino Prime
          </span>
          <span className="mt-1 block text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Utah Legal-Tech
          </span>
        </span>
      ) : null}
    </span>
  )
}

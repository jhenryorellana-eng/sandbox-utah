import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-white/76 px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm outline-none ring-offset-background backdrop-blur-xl transition-all placeholder:text-muted-foreground/75 focus-visible:border-primary/45 focus-visible:bg-white/95 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-extrabold",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

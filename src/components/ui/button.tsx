import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-extrabold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "interactive-shine bg-primary text-primary-foreground shadow-[0_14px_28px_oklch(0.31_0.101_257_/_18%)] hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_18px_36px_oklch(0.31_0.101_257_/_24%)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_14px_28px_oklch(0.55_0.22_28_/_18%)] hover:-translate-y-0.5 hover:bg-destructive/92",
        outline:
          "border border-input bg-white/72 text-foreground shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/90 hover:text-primary hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/85 hover:shadow-md",
        ghost: "text-foreground hover:bg-white/70 hover:text-primary",
        link: "h-auto rounded-none p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-lg px-8",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = "Button"

export { buttonVariants }

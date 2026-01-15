
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5",
                destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20 border border-red-500/20",
                outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100",
                secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700",
                ghost: "hover:bg-zinc-800/50 hover:text-zinc-100",
                link: "text-blue-400 underline-offset-4 hover:underline",
                glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-xl",
            },
            size: {
                default: "h-12 px-4 py-2",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-16 rounded-2xl px-8 text-lg font-bold",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // Removed Slot logic to simplify for now, sticking to simple button
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

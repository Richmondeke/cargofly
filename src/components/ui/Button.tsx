import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20",
                destructive:
                    "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
                outline:
                    "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-background-dark dark:hover:bg-slate-800 dark:text-white",
                secondary:
                    "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
                ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-white",
                link: "text-primary underline-offset-4 hover:underline",
                premium: "bg-gold-500 text-navy-900 border border-gold-400 hover:bg-gold-400 shadow-xl shadow-gold-500/20 uppercase tracking-wider font-black",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-14 rounded-2xl px-10 text-base",
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
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, children, ...props }, ref) => {
        if (asChild) {
            return (
                <Slot
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                >
                    {children}
                </Slot>
            )
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

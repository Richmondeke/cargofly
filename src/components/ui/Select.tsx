
import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="relative">
                <select
                    className={cn(
                        "flex h-full w-full appearance-none rounded-xl border border-navy-900/10 bg-navy-900/5 px-4 py-4 pr-12 text-sm transition-colors focus:outline-none focus:border-gold-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white font-body cursor-pointer",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-navy-900/60 dark:text-white/60">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }

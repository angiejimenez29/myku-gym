import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground/80">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-foreground/10 bg-container px-3 py-2 text-sm text-foreground placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(59,130,246,0.22)] hover:bg-primary/92 hover:shadow-[0_10px_22px_rgba(59,130,246,0.28)]',
        destructive: 'bg-destructive text-destructive-foreground shadow-[0_8px_18px_rgba(220,38,38,0.16)] hover:bg-destructive/92',
        outline: 'border border-border/90 bg-background/88 text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-border hover:bg-accent/80',
        secondary: 'bg-secondary/90 text-secondary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-secondary',
        ghost: 'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8.5 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

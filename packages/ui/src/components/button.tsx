import * as React from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        'ghost-muted': 'text-fg-secondary hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // CTA: lime bg + black text em dark / black bg + lime text em light
        // A inversão acontece via CSS vars --cta-bg / --cta-fg trocados no .dark
        cta: 'w-full bg-cta-bg text-cta-fg rounded-md py-[15px] text-[15px] font-medium tracking-[0.2px] hover:opacity-90 active:scale-[0.98]',
        // CTA desabilitado
        'cta-disabled':
          'w-full bg-muted text-muted-foreground rounded-md py-[15px] text-[15px] font-medium cursor-not-allowed',
      },
      size: {
        none: '',
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Ícone renderizado à esquerda do texto (ex: <WhatsAppLogo size={18} />) */
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    // variant="cta" não usa size (tem padding próprio)
    const sizeValue = variant === 'cta' || variant === 'cta-disabled' ? 'none' : size
    return (
      <Comp
        className={cn(buttonVariants({ variant, size: sizeValue, className }))}
        ref={ref}
        {...props}
      >
        {icon}
        <Slottable>{children}</Slottable>
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-highlight focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:bg-primary-focus',
        destructive: 'border-danger-border bg-danger-bg text-danger-text hover:bg-danger-border/40',
        outline: 'border-border bg-transparent text-foreground hover:bg-brand-light',
        secondary: 'border-border bg-brand-light text-foreground hover:bg-brand-hover',
        ghost: 'border-transparent bg-transparent hover:bg-brand-light hover:text-foreground',
        link: 'border-transparent bg-transparent underline-offset-4 hover:underline text-foreground',
      },
      size: {
        default: 'h-9 py-2 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8 rounded-md',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

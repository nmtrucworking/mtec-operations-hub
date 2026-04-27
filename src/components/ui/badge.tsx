import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gold text-background hover:bg-gold-hover',
        secondary: 'border-transparent bg-brand-light text-primary hover:bg-brand-hover',
        success: 'border-success-border bg-success-bg text-success-text',
        danger: 'border-danger-border bg-danger-bg text-danger-text',
        warning: 'border-warning-border bg-warning-bg text-warning-text',
        outline: 'text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

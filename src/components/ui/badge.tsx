import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-highlight focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-border bg-brand-light text-foreground hover:bg-brand-hover',
        secondary: 'border-border bg-background text-secondary hover:text-foreground',
        success: 'border-success-border bg-success-bg text-success-text',
        danger: 'border-danger-border bg-danger-bg text-danger-text',
        warning: 'border-warning-border bg-warning-bg text-warning-text',
        outline: 'border-border text-foreground',
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

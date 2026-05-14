import * as React from 'react';
import { cn } from '../../lib/utils';

import { Eye, EyeOff } from 'lucide-react';


export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const isDate = type === 'date';

    const togglePassword = () => setShowPassword(!showPassword);

    return (
      <div className="relative w-full group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary group-focus-within:text-gold transition-colors">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            icon && 'pl-10',
            isPassword && 'pr-10',
            isDate && 'relative w-full appearance-none',
            isDate && '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10 [&::-webkit-datetime-edit]:text-primary',
            className
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-gold transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

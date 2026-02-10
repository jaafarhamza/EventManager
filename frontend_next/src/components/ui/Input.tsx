import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-(--color-border) bg-(--color-input) px-3 py-6',
          'text-sm text-(--color-foreground) placeholder:text-(--color-muted-foreground)',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring) focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

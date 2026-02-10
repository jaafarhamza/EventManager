import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // If asChild is true, render children directly
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring) focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            // Variants
            'bg-(--color-primary) text-(--color-primary-foreground) hover:opacity-90':
              variant === 'primary',
            'bg-(--color-secondary) text-(--color-secondary-foreground) hover:opacity-90':
              variant === 'secondary',
            'bg-(--color-tertiary) text-(--color-tertiary-foreground) hover:opacity-90':
              variant === 'tertiary',
            'bg-(--color-destructive) text-(--color-destructive-foreground) hover:opacity-90':
              variant === 'destructive',
            'border border-(--color-border) bg-(--color-background) hover:bg-(--color-muted) hover:text-(--color-foreground)':
              variant === 'outline',
            'hover:bg-(--color-muted) hover:text-(--color-foreground)': variant === 'ghost',
            
            // Sizes
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-md p-2 text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground) transition-colors"
        aria-label="Toggle theme"
      >
        <span className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex items-center justify-center rounded-md p-2 text-(--color-muted-foreground) hhover:text-[var(--color-foreground)] hover:text-(--color-foreground) transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-(--color-muted) p-1">
      <button
        onClick={() => setTheme('light')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          theme === 'light'
            ? 'bg-(--color-background) text-(--color-foreground) shadow-sm'
            : 'text-(--color-muted-foreground) hover:text-(--color-foreground)'
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          theme === 'dark'
            ? 'bg-(--color-background) text-(--color-foreground) shadow-sm'
            : 'text-(--color-muted-foreground) hover:text-(--color-foreground)'
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          theme === 'system'
            ? 'bg-(--color-background) text-(--color-foreground) shadow-sm'
            : 'text-(--color-muted-foreground) hover:text-(--color-foreground)'
        }`}
      >
        System
      </button>
    </div>
  );
}

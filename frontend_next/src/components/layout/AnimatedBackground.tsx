'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Background with smooth transition */}
      <div className="absolute inset-0 bg-(--color-background) transition-colors duration-500" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0">
        {/* Primary Orb - Top Right */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-2xl opacity-30 dark:opacity-20 animate-blob transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
          }}
        />
        
        {/* Tertiary Orb - Bottom Left */}
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, var(--color-tertiary) 0%, transparent 70%)',
          }}
        />
        
        {/* Secondary Orb - Center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-15 animate-blob animation-delay-4000 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.1] dark:opacity-[0.05] transition-opacity duration-500"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-foreground) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-30 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 0%, var(--color-background) 100%)`,
        }}
      />
    </div>
  );
}

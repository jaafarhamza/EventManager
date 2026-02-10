'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-(--color-border) bg-(--color-card) backdrop-blur-sm transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-tertiary) opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-tertiary)" />
            </span>
            <span className="text-sm font-medium text-(--color-muted-foreground)">
              Now Live - Book Your Next Event
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-(family-name:--font-mclaren) text-(--color-foreground) leading-tight transition-all duration-700 delay-100 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Discover Amazing
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-(--color-primary) to-(--color-tertiary) bg-clip-text text-transparent">
                  Events Near You
                </span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-(--color-primary) opacity-20 blur-sm" />
              </span>
            </h1>

            <p
              className={`max-w-2xl mx-auto text-lg sm:text-xl text-(--color-muted-foreground) transition-all duration-700 delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Join thousands of people discovering and booking incredible events.
              From workshops to conferences, find your next experience.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Button
              variant="primary"
              size="lg"
              className="group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Explore Events
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <span className="absolute inset-0 bg-linear-to-r from-(--color-primary) to-(--color-tertiary) opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button variant="outline" size="lg" className="group">
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Watch Demo
              </span>
            </Button>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 transition-all duration-700 delay-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
                <CountUp end={500} duration={2000} />+
              </div>
              <div className="text-sm text-(--color-muted-foreground)">
                Active Events
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
                <CountUp end={10000} duration={2000} />+
              </div>
              <div className="text-sm text-(--color-muted-foreground)">
                Happy Attendees
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
                <CountUp end={50} duration={2000} />+
              </div>
              <div className="text-sm text-(--color-muted-foreground)">
                Cities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Text Banner at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
        
        {/* Fixed Text - Single Instance */}
        <div className="relative flex items-center justify-center pb-2">
          <h2 className="text-[10.8vw] font-(family-name:--font-mclaren) font-extrabold text-(--color-foreground) opacity-5 whitespace-nowrap leading-none">
            EVENT MANAGER
          </h2>
        </div>
      </div>
    </section>
  );
}

// Count Up Animation Component
function CountUp({ end, duration }: { end: number; duration: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Show placeholder during SSR to avoid layout shift
  if (!mounted) {
    return (
      <button
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl",
          "bg-secondary/50 transition-theme",
          className
        )}
        aria-label="Cambiar tema"
        disabled
      >
        <div className="h-5 w-5 rounded-full bg-muted-foreground/20" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl",
        "bg-secondary hover:bg-accent transition-theme",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-95",
        className
      )}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Sun Icon */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          isDark ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0",
          "transition-all duration-300 ease-out"
        )}
      >
        {/* Sun rays - rotating container */}
        <div className="absolute animate-rays-spin">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-10px)`,
              }}
            >
              <div className="h-1.5 w-0.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            </div>
          ))}
        </div>
        {/* Sun center */}
        <div className="relative z-10 h-4 w-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
      </div>

      {/* Moon Icon */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90",
          "transition-all duration-300 ease-out"
        )}
      >
        <div className="relative">
          {/* Moon body */}
          <div className="h-5 w-5 rounded-full bg-slate-200 shadow-lg shadow-slate-200/20" />
          {/* Moon crater shadow */}
          <div className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-background" />
        </div>
        
        {/* Stars */}
        <div className="absolute -right-1 -top-1 h-1 w-1 animate-pulse rounded-full bg-slate-300" />
        <div className="absolute -left-1 top-0 h-0.5 w-0.5 animate-pulse rounded-full bg-slate-400 delay-75" />
        <div className="absolute -bottom-0.5 -left-0.5 h-0.5 w-0.5 animate-pulse rounded-full bg-slate-300 delay-150" />
      </div>
    </button>
  );
}

/* Compact version for tight spaces */
export function ThemeToggleCompact({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50",
          className
        )}
        disabled
      >
        <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        "bg-secondary hover:bg-accent transition-theme",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:scale-95",
        className
      )}
      aria-label={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? (
        <svg
          className="h-4 w-4 text-slate-200 animate-moon-rise"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-amber-500 animate-sun-rise"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

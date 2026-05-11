"use client";

import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG } from "@/lib/types/behavior";

interface SeveritySelectorProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (severity: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

export function SeveritySelector({
  value,
  onChange,
  disabled = false,
}: SeveritySelectorProps) {
  const severities = [1, 2, 3, 4, 5] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Nivel de Gravedad
        </span>
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
            SEVERITY_CONFIG[value].bgColor,
            SEVERITY_CONFIG[value].textColor
          )}
        >
          {SEVERITY_CONFIG[value].label}
        </span>
      </div>

      {/* Visual Scale */}
      <div className="flex gap-2">
        {severities.map((level) => {
          const config = SEVERITY_CONFIG[level];
          const isSelected = value === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => !disabled && onChange(level)}
              disabled={disabled}
              className={cn(
                "flex-1 h-12 rounded-lg border-2 transition-all duration-200",
                "flex flex-col items-center justify-center gap-0.5",
                "hover:scale-[1.02] active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? cn(
                      config.bgColor,
                      "border-transparent ring-2",
                      config.ringColor
                    )
                  : "border-border bg-card hover:border-muted-foreground/30",
                disabled && "opacity-50 cursor-not-allowed hover:scale-100"
              )}
              aria-label={`Gravedad ${level}: ${config.label}`}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors",
                  isSelected ? config.dotColor : "bg-muted-foreground/30"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isSelected ? config.textColor : "text-muted-foreground"
                )}
              >
                {level}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {SEVERITY_CONFIG[value].description}
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GradeScale, GradeEntry } from "@/lib/types/grades";
import { roundToDecimals, isPassingGrade } from "@/lib/types/grades";

interface GradeCellProps {
  grade: GradeEntry | null;
  assessmentId: string;
  studentId: string;
  scale: GradeScale;
  maxValue: number;
  isPublished: boolean;
  onUpdate: (
    studentId: string,
    assessmentId: string,
    value: number | null
  ) => Promise<void>;
  disabled?: boolean;
}

const DEBOUNCE_MS = 800;

export const GradeCell = memo(function GradeCell({
  grade,
  assessmentId,
  studentId,
  scale,
  maxValue,
  isPublished,
  onUpdate,
  disabled = false,
}: GradeCellProps) {
  const [localValue, setLocalValue] = useState<string>(
    grade?.value !== null && grade?.value !== undefined
      ? String(grade.value)
      : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValue = useRef<string>(localValue);

  // Sync with external grade changes
  useEffect(() => {
    const newValue =
      grade?.value !== null && grade?.value !== undefined
        ? String(grade.value)
        : "";
    if (newValue !== lastSavedValue.current) {
      setLocalValue(newValue);
      lastSavedValue.current = newValue;
    }
  }, [grade?.value]);

  const validateAndSave = useCallback(
    async (value: string) => {
      // Skip if value hasn't changed
      if (value === lastSavedValue.current) return;

      // Handle empty value
      if (value === "" || value.trim() === "") {
        setIsSaving(true);
        setError(null);
        try {
          await onUpdate(studentId, assessmentId, null);
          lastSavedValue.current = "";
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 1500);
        } catch {
          setError("Error al guardar");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Parse and validate numeric value
      const numValue = parseFloat(value.replace(",", "."));

      if (isNaN(numValue)) {
        setError("Valor invalido");
        return;
      }

      if (numValue < 0 || numValue > maxValue) {
        setError(`Debe ser entre 0 y ${maxValue}`);
        return;
      }

      // Round to avoid floating point issues
      const roundedValue = roundToDecimals(numValue);

      setIsSaving(true);
      setError(null);

      try {
        await onUpdate(studentId, assessmentId, roundedValue);
        lastSavedValue.current = String(roundedValue);
        setLocalValue(String(roundedValue));
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
      } catch {
        setError("Error al guardar");
      } finally {
        setIsSaving(false);
      }
    },
    [studentId, assessmentId, maxValue, onUpdate]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    setError(null);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      validateAndSave(value);
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
    // Clear debounce and save immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    validateAndSave(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      validateAndSave(localValue);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const numericValue = localValue ? parseFloat(localValue.replace(",", ".")) : null;
  const passing = numericValue !== null ? isPassingGrade(numericValue, scale) : null;

  return (
    <TooltipProvider>
      <div className="relative group">
        <div className="relative">
          <Input
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSaving}
            placeholder="-"
            className={cn(
              "w-16 h-10 text-center font-medium text-base transition-all duration-200",
              "focus:ring-2 focus:ring-primary/30 focus:border-primary",
              // Color based on passing status
              numericValue !== null && passing !== null && (
                passing
                  ? "bg-status-present-soft/50 border-status-present/30 text-status-present-foreground"
                  : "bg-status-absent-soft/50 border-status-absent/30 text-status-absent-foreground"
              ),
              // Error state
              error && "border-destructive bg-destructive/10",
              // Disabled state
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />

          {/* Saving indicator */}
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <Loader2 className="size-4 animate-spin text-primary" />
            </div>
          )}

          {/* Saved indicator */}
          {showSaved && !isSaving && (
            <div className="absolute -top-1 -right-1 size-4 rounded-full bg-status-present flex items-center justify-center">
              <Check className="size-2.5 text-status-present-foreground" />
            </div>
          )}

          {/* Publication status indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center",
                  "transition-opacity opacity-0 group-hover:opacity-100",
                  isPublished
                    ? "bg-status-present text-status-present-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isPublished ? (
                  <Eye className="size-2.5" />
                ) : (
                  <EyeOff className="size-2.5" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isPublished ? "Visible para padres" : "No publicada"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Error message */}
        {error && (
          <p className="absolute -bottom-5 left-0 right-0 text-[10px] text-destructive text-center truncate">
            {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
});

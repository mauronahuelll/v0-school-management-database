"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, Loader2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    value: number | null,
    conceptual?: string | null
  ) => Promise<void>;
  disabled?: boolean;
}

const DEBOUNCE_MS = 800;

// Conceptual grade values with their display info
const CONCEPTUAL_VALUES = [
  { value: "TEA", label: "TEA", description: "Trayectoria Escolar Avanzada", color: "text-[#4de082]", bg: "bg-[#4de082]/10" },
  { value: "TEP", label: "TEP", description: "Trayectoria Escolar en Proceso", color: "text-[#d0bcff]", bg: "bg-[#d0bcff]/10" },
  { value: "TED", label: "TED", description: "Trayectoria Escolar con Dificultades", color: "text-[#ffb4ab]", bg: "bg-[#ffb4ab]/10" },
];

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
  // For numeric grades
  const [localValue, setLocalValue] = useState<string>(
    grade?.value !== null && grade?.value !== undefined
      ? String(grade.value)
      : ""
  );
  
  // For conceptual grades
  const [conceptualValue, setConceptualValue] = useState<string | null>(
    grade?.conceptual || null
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValue = useRef<string>(localValue);
  const lastSavedConceptual = useRef<string | null>(conceptualValue);

  const isConceptual = scale.type === "CONCEPTUAL";

  // Sync with external grade changes
  useEffect(() => {
    if (isConceptual) {
      const newConceptual = grade?.conceptual || null;
      if (newConceptual !== lastSavedConceptual.current) {
        setConceptualValue(newConceptual);
        lastSavedConceptual.current = newConceptual;
      }
    } else {
      const newValue =
        grade?.value !== null && grade?.value !== undefined
          ? String(grade.value)
          : "";
      if (newValue !== lastSavedValue.current) {
        setLocalValue(newValue);
        lastSavedValue.current = newValue;
      }
    }
  }, [grade?.value, grade?.conceptual, isConceptual]);

  // Handle conceptual grade change
  const handleConceptualChange = useCallback(
    async (value: string) => {
      if (value === lastSavedConceptual.current) return;

      setIsSaving(true);
      setError(null);

      try {
        await onUpdate(studentId, assessmentId, null, value || null);
        lastSavedConceptual.current = value || null;
        setConceptualValue(value || null);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
      } catch {
        setError("Error al guardar");
      } finally {
        setIsSaving(false);
      }
    },
    [studentId, assessmentId, onUpdate]
  );

  // Handle numeric grade validation and save
  const validateAndSave = useCallback(
    async (value: string) => {
      if (value === lastSavedValue.current) return;

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

      const numValue = parseFloat(value.replace(",", "."));

      if (isNaN(numValue)) {
        setError("Valor invalido");
        return;
      }

      // Strict validation: only 1-10
      if (numValue < 1 || numValue > 10) {
        setError("Solo 1-10");
        return;
      }

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
    [studentId, assessmentId, onUpdate]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers, comma and dot
    if (value && !/^[0-9,.\s]*$/.test(value)) {
      return;
    }
    
    setLocalValue(value);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      validateAndSave(value);
    }, DEBOUNCE_MS);
  };

  const handleBlur = () => {
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const numericValue = localValue ? parseFloat(localValue.replace(",", ".")) : null;
  const passing = numericValue !== null ? isPassingGrade(numericValue, scale) : null;

  // Get conceptual grade display info
  const conceptualInfo = conceptualValue 
    ? CONCEPTUAL_VALUES.find(v => v.value === conceptualValue)
    : null;

  return (
    <TooltipProvider>
      <div className="relative group">
        <div className="relative">
          {isConceptual ? (
            // Conceptual Grade Selector (TEA/TEP/TED)
            <Select
              value={conceptualValue || ""}
              onValueChange={handleConceptualChange}
              disabled={disabled || isSaving}
            >
              <SelectTrigger
                className={cn(
                  "w-20 h-10 text-center font-bold text-sm transition-all duration-200",
                  "bg-white/[0.02] border-white/10 hover:border-white/20",
                  conceptualInfo && `${conceptualInfo.bg} ${conceptualInfo.color} border-current/30`,
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <SelectValue placeholder="-">
                  {conceptualValue || "-"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#131319] border-white/10">
                {CONCEPTUAL_VALUES.map((opt) => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className={cn("font-bold", opt.color)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Numeric Grade Input (1-10)
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
                "w-16 h-10 text-center font-bold text-base transition-all duration-200",
                "bg-white/[0.02] border-white/10",
                "focus:ring-2 focus:ring-[#d0bcff]/30 focus:border-[#d0bcff]",
                // Color based on passing status (>= 7 green, < 7 red)
                numericValue !== null && passing !== null && (
                  passing
                    ? "bg-[#4de082]/10 border-[#4de082]/30 text-[#4de082]"
                    : "bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]"
                ),
                error && "border-[#ffb4ab] bg-[#ffb4ab]/10",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
          )}

          {/* Saving indicator */}
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131319]/80 rounded-md">
              <Loader2 className="size-4 animate-spin text-[#d0bcff]" />
            </div>
          )}

          {/* Saved indicator */}
          {showSaved && !isSaving && (
            <div className="absolute -top-1 -right-1 size-4 rounded-full bg-[#4de082] flex items-center justify-center">
              <Check className="size-2.5 text-[#131319]" />
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
                    ? "bg-[#4de082] text-[#131319]"
                    : "bg-white/10 text-white/40"
                )}
              >
                {isPublished ? (
                  <Eye className="size-2.5" />
                ) : (
                  <EyeOff className="size-2.5" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs bg-[#131319] border-white/10">
              {isPublished ? "Visible para padres" : "No publicada"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Error message */}
        {error && (
          <p className="absolute -bottom-5 left-0 right-0 text-[10px] text-[#ffb4ab] text-center truncate">
            {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
});

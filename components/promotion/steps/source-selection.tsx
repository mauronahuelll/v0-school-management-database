"use client";

import { motion } from "framer-motion";
import { School, GraduationCap, BookOpen, Users, ChevronRight, Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type CourseLevel,
  type Course,
  type Division,
  getLevelLabel,
  getShiftLabel,
  MOCK_SCHOOL_CONTEXT,
} from "@/lib/types/school-context";

// Nivel adicional para soporte de Inicial
type ExtendedCourseLevel = CourseLevel | "INITIAL";

const EXTENDED_LEVEL_LABELS: Record<ExtendedCourseLevel, string> = {
  INITIAL: "Nivel Inicial",
  PRIMARY: "Nivel Primario",
  SECONDARY: "Nivel Secundario",
  TERTIARY: "Nivel Terciario/Superior",
};

// ============================================
// STEP 1: SOURCE SELECTION
// Bespoke design with level cards and course list
// ============================================

interface SourceSelectionProps {
  selectedLevel: CourseLevel | null;
  selectedCourse: Course | null;
  selectedDivision: Division | null;
  onLevelChange: (level: CourseLevel) => void;
  onCourseChange: (course: Course) => void;
  onDivisionChange: (division: Division) => void;
  onNext: () => void;
}

const LEVEL_ICONS: Record<CourseLevel, React.ComponentType<{ className?: string }>> = {
  PRIMARY: School,
  SECONDARY: GraduationCap,
  TERTIARY: BookOpen,
};

const LEVEL_COLORS: Record<CourseLevel, string> = {
  PRIMARY: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  SECONDARY: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  TERTIARY: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
};

const LEVEL_ACCENT: Record<CourseLevel, string> = {
  PRIMARY: "bg-emerald-500 text-white",
  SECONDARY: "bg-blue-500 text-white",
  TERTIARY: "bg-purple-500 text-white",
};

const LEVEL_BADGE_COLORS: Record<CourseLevel, string> = {
  PRIMARY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SECONDARY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  TERTIARY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function SourceSelection({
  selectedLevel,
  selectedCourse,
  selectedDivision,
  onLevelChange,
  onCourseChange,
  onDivisionChange,
  onNext,
}: SourceSelectionProps) {
  const levels = MOCK_SCHOOL_CONTEXT.levels;
  const courses = selectedLevel
    ? levels.find((l) => l.id === selectedLevel)?.courses || []
    : [];

  const canProceed = selectedLevel && selectedCourse && selectedDivision;

  return (
    <div className="space-y-10">
      {/* Level Selection */}
      <section>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Nivel Educativo de Origen
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona el nivel desde el cual se promoveran los alumnos al siguiente ciclo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map((level, index) => {
            const Icon = LEVEL_ICONS[level.id];
            const isSelected = selectedLevel === level.id;
            const totalStudents = level.courses.reduce(
              (acc, c) => acc + c.divisions.reduce((a, d) => a + d.studentCount, 0),
              0
            );

            // Determinar cursos de egreso (ultimos del nivel)
            const lastCourses = level.courses.filter(c => {
              if (level.id === "PRIMARY") return c.year === 6 || c.year === 7;
              if (level.id === "SECONDARY") return c.year === 5 || c.year === 6;
              return c.year === level.courses.length;
            });

            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  onLevelChange(level.id);
                  // Reset course and division when level changes
                }}
                className={cn(
                  "relative p-6 rounded-2xl text-left",
                  "border-2 transition-all duration-300",
                  "bg-gradient-to-br",
                  "hover:shadow-lg hover:-translate-y-1",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? cn(LEVEL_COLORS[level.id], "shadow-lg -translate-y-1")
                    : "border-border/50 bg-card hover:border-border"
                )}
              >
                {/* Icon badge */}
                <div
                  className={cn(
                    "inline-flex items-center justify-center size-12 rounded-xl mb-4",
                    isSelected ? LEVEL_ACCENT[level.id] : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-6" />
                </div>

                <h4 className="font-semibold text-foreground text-lg">
                  {level.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {level.courses.length} cursos disponibles
                </p>

                {/* Stats chip */}
                <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {totalStudents} alumnos
                </div>

                {/* Egreso indicator */}
                {lastCourses.length > 0 && (
                  <div className={cn(
                    "mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border",
                    LEVEL_BADGE_COLORS[level.id]
                  )}>
                    Cursos de egreso: {lastCourses.map(c => `${c.year}°`).join(", ")}
                  </div>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="levelIndicator"
                    className={cn(
                      "absolute top-3 right-3 size-6 rounded-full",
                      "flex items-center justify-center",
                      LEVEL_ACCENT[level.id]
                    )}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <ChevronRight className="size-4" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Course & Division Selection */}
      {selectedLevel && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Curso y Division
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona el curso especifico del cual provienen los alumnos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "hero-card p-5",
                  selectedCourse?.id === course.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">
                    {course.name}
                  </h4>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                    {course.divisions.length} division{course.divisions.length > 1 ? "es" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.divisions.map((division) => {
                    const isSelected =
                      selectedCourse?.id === course.id &&
                      selectedDivision?.id === division.id;

                    return (
                      <button
                        key={division.id}
                        onClick={() => {
                          onCourseChange(course);
                          onDivisionChange(division);
                        }}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium",
                          "border-2 transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card border-border hover:border-primary/50 hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{course.year}° &quot;{division.name}&quot;</span>
                          <span className="text-xs opacity-70">
                            ({division.studentCount})
                          </span>
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                          {getShiftLabel(division.shift)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Selection Summary & Next */}
      {canProceed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 glass-panel rounded-2xl"
        >
          <div>
            <p className="text-sm text-muted-foreground">Origen seleccionado</p>
            <p className="font-semibold text-foreground">
              {getLevelLabel(selectedLevel)} - {selectedCourse.name} &quot;{selectedDivision.name}&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedDivision.studentCount} alumnos en esta division
            </p>
          </div>

          <Button
            size="lg"
            onClick={onNext}
            className="rounded-xl px-8 shadow-lg"
          >
            Continuar
            <ChevronRight className="size-5 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

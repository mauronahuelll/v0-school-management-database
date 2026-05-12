"use client";

import { motion } from "framer-motion";
import {
  School,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
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

// ============================================
// STEP 3: DESTINATION CONFIGURATION
// Mirror of source selection with visual flow
// ============================================

interface DestinationConfigProps {
  // Source info for context
  sourceLevel: CourseLevel;
  sourceCourse: Course;
  sourceDivision: Division;
  selectedCount: number;
  
  // Destination state
  destinationLevel: CourseLevel | null;
  destinationCourse: Course | null;
  destinationDivision: Division | null;
  onLevelChange: (level: CourseLevel) => void;
  onCourseChange: (course: Course) => void;
  onDivisionChange: (division: Division) => void;
  onNext: () => void;
  onBack: () => void;
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

export function DestinationConfig({
  sourceLevel,
  sourceCourse,
  sourceDivision,
  selectedCount,
  destinationLevel,
  destinationCourse,
  destinationDivision,
  onLevelChange,
  onCourseChange,
  onDivisionChange,
  onNext,
  onBack,
}: DestinationConfigProps) {
  const levels = MOCK_SCHOOL_CONTEXT.levels;
  const courses = destinationLevel
    ? levels.find((l) => l.id === destinationLevel)?.courses || []
    : [];

  const canProceed = destinationLevel && destinationCourse && destinationDivision;

  // Suggest logical next level
  const suggestedNextLevel = (): CourseLevel | null => {
    if (sourceLevel === "PRIMARY") return "SECONDARY";
    if (sourceLevel === "SECONDARY") return "TERTIARY";
    return null;
  };

  return (
    <div className="space-y-10">
      {/* Transfer summary visual */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 hero-card"
      >
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {/* Source */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Desde
            </p>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border">
              <p className="font-semibold text-foreground">
                {getLevelLabel(sourceLevel)}
              </p>
              <p className="text-sm text-muted-foreground">
                {sourceCourse.name} &quot;{sourceDivision.name}&quot;
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
              <Users className="size-4 text-primary" />
              <span className="font-bold text-primary">{selectedCount}</span>
            </div>
            <ArrowRight className="size-6 text-primary" />
          </div>

          {/* Destination */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Hacia
            </p>
            <div
              className={cn(
                "p-4 rounded-2xl border-2 border-dashed transition-all",
                canProceed
                  ? "bg-primary/5 border-primary"
                  : "bg-muted/30 border-border"
              )}
            >
              {canProceed ? (
                <>
                  <p className="font-semibold text-foreground">
                    {getLevelLabel(destinationLevel!)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {destinationCourse!.name} &quot;{destinationDivision!.name}&quot;
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Seleccionar destino</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Level Selection */}
      <section>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Nivel Educativo de Destino
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona el nivel al cual se promoveran los alumnos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map((level, index) => {
            const Icon = LEVEL_ICONS[level.id];
            const isSelected = destinationLevel === level.id;
            const isSuggested = level.id === suggestedNextLevel();
            const totalCapacity = level.courses.reduce(
              (acc, c) =>
                acc + c.divisions.reduce((a, d) => a + (40 - d.studentCount), 0),
              0
            );

            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onLevelChange(level.id)}
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
                {/* Suggested badge */}
                {isSuggested && !isSelected && (
                  <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Recomendado
                  </div>
                )}

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

                {/* Capacity chip */}
                <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-present-soft/50 text-xs text-status-present-foreground">
                  ~{totalCapacity} lugares disponibles
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="destLevelIndicator"
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
      {destinationLevel && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Curso y Division de Destino
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona el curso donde se ubicaran los alumnos promovidos
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
                  destinationCourse?.id === course.id && "ring-2 ring-primary"
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
                      destinationCourse?.id === course.id &&
                      destinationDivision?.id === division.id;
                    const availableSpots = Math.max(0, 40 - division.studentCount);

                    return (
                      <button
                        key={division.id}
                        onClick={() => {
                          onCourseChange(course);
                          onDivisionChange(division);
                        }}
                        disabled={availableSpots < selectedCount}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium",
                          "border-2 transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : availableSpots >= selectedCount
                            ? "bg-card border-border hover:border-primary/50 hover:bg-accent"
                            : "bg-muted/50 border-border/50 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{course.year}° &quot;{division.name}&quot;</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs opacity-70 mt-0.5">
                          <span>{getShiftLabel(division.shift)}</span>
                          <span
                            className={cn(
                              availableSpots >= selectedCount
                                ? "text-status-present"
                                : "text-status-absent"
                            )}
                          >
                            {availableSpots} lugares
                          </span>
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

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 glass-panel rounded-2xl">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="rounded-xl"
        >
          <ChevronLeft className="size-5 mr-2" />
          Volver
        </Button>

        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-xl px-8 shadow-lg"
        >
          Continuar a Ejecucion
          <ChevronRight className="size-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

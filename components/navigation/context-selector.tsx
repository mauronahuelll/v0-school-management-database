"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Users,
  Check,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSchoolContext } from "@/lib/context/school-context";
import type {
  CourseLevel,
  Course,
  Division,
} from "@/lib/types/school-context";
import {
  getLevelLabel,
  getShiftShortLabel,
  formatCourseShortDisplay,
} from "@/lib/types/school-context";

// ============================================
// LEVEL ICONS
// ============================================

const LEVEL_ICONS: Record<CourseLevel, typeof School> = {
  PRIMARY: School,
  SECONDARY: GraduationCap,
  TERTIARY: BookOpen,
};

const LEVEL_COLORS: Record<CourseLevel, string> = {
  PRIMARY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  SECONDARY: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  TERTIARY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

// ============================================
// CONTEXT SELECTOR COMPONENT
// ============================================

interface ContextSelectorProps {
  isCollapsed?: boolean;
  className?: string;
}

export function ContextSelector({
  isCollapsed = false,
  className,
}: ContextSelectorProps) {
  const {
    context,
    currentLevel,
    currentCourse,
    currentDivision,
    selectLevel,
    selectDivision,
    clearSelection,
    isContextComplete,
  } = useSchoolContext();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<CourseLevel | null>(
    currentLevel
  );
  const [expandedCourse, setExpandedCourse] = useState<string | null>(
    currentCourse?.id || null
  );

  // Display text
  const displayText = useMemo(() => {
    if (!isContextComplete || !currentCourse || !currentDivision) {
      return "Seleccionar curso";
    }
    return formatCourseShortDisplay(currentCourse, currentDivision);
  }, [isContextComplete, currentCourse, currentDivision]);

  const displayLevel = useMemo(() => {
    if (!currentLevel) return null;
    return getLevelLabel(currentLevel);
  }, [currentLevel]);

  // Handle division selection
  const handleDivisionSelect = (division: Division) => {
    selectDivision(division.id);
    setIsOpen(false);
  };

  // Toggle level expansion
  const toggleLevel = (level: CourseLevel) => {
    if (expandedLevel === level) {
      setExpandedLevel(null);
      setExpandedCourse(null);
    } else {
      setExpandedLevel(level);
      selectLevel(level);
      setExpandedCourse(null);
    }
  };

  // Toggle course expansion
  const toggleCourse = (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between gap-2",
            "glass-subtle hover:glass",
            "border border-glass-border",
            "transition-all duration-200",
            isCollapsed ? "px-2" : "px-3",
            className
          )}
        >
          {isCollapsed ? (
            <Layers className="size-5 text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {currentLevel && (
                <div
                  className={cn(
                    "size-7 rounded-lg flex items-center justify-center shrink-0",
                    LEVEL_COLORS[currentLevel]
                  )}
                >
                  {(() => {
                    const Icon = LEVEL_ICONS[currentLevel];
                    return <Icon className="size-4" />;
                  })()}
                </div>
              )}
              {!currentLevel && (
                <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                  <Layers className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium truncate">{displayText}</p>
                {displayLevel && (
                  <p className="text-xs text-muted-foreground truncate">
                    {displayLevel}
                  </p>
                )}
              </div>
            </div>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-80 p-0",
          "glass-strong",
          "border-glass-border",
          "shadow-xl"
        )}
        align={isCollapsed ? "start" : "center"}
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <School className="size-4 text-primary" />
            <span className="text-sm font-semibold">Seleccionar Curso</span>
          </div>
          {isContextComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearSelection();
                setExpandedLevel(null);
                setExpandedCourse(null);
              }}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Levels List */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-1">
            {context.levels.map((level) => {
              const Icon = LEVEL_ICONS[level.id];
              const isLevelExpanded = expandedLevel === level.id;
              const isLevelSelected = currentLevel === level.id;
              const totalStudents = level.courses.reduce(
                (acc, c) =>
                  acc + c.divisions.reduce((d, div) => d + div.studentCount, 0),
                0
              );

              return (
                <div key={level.id} className="space-y-1">
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(level.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "transition-all duration-200",
                      "hover:bg-accent/50",
                      isLevelSelected && "bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center",
                        LEVEL_COLORS[level.id]
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{level.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {level.courses.length} cursos - {totalStudents} alumnos
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-200",
                        isLevelExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Courses */}
                  <AnimatePresence>
                    {isLevelExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 space-y-1">
                          {level.courses.map((course) => {
                            const isCourseExpanded = expandedCourse === course.id;
                            const isCourseSelected = currentCourse?.id === course.id;
                            const courseStudents = course.divisions.reduce(
                              (acc, d) => acc + d.studentCount,
                              0
                            );

                            return (
                              <div key={course.id} className="space-y-1">
                                {/* Course Header */}
                                <button
                                  onClick={() => toggleCourse(course.id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                                    "transition-all duration-200",
                                    "hover:bg-accent/30",
                                    isCourseSelected && "bg-accent/50"
                                  )}
                                >
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium">
                                      {course.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {course.divisions.length} divisiones -{" "}
                                      {courseStudents} alumnos
                                    </p>
                                  </div>
                                  <ChevronRight
                                    className={cn(
                                      "size-3 text-muted-foreground transition-transform duration-200",
                                      isCourseExpanded && "rotate-90"
                                    )}
                                  />
                                </button>

                                {/* Divisions */}
                                <AnimatePresence>
                                  {isCourseExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pl-4 space-y-0.5">
                                        {course.divisions.map((division) => {
                                          const isDivisionSelected =
                                            currentDivision?.id === division.id;

                                          return (
                                            <button
                                              key={division.id}
                                              onClick={() =>
                                                handleDivisionSelect(division)
                                              }
                                              className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                                                "transition-all duration-200",
                                                "hover:bg-primary/10",
                                                isDivisionSelected &&
                                                  "bg-primary/15 text-primary"
                                              )}
                                            >
                                              <div className="flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">
                                                    Division &quot;{division.name}&quot;
                                                  </span>
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-1.5 py-0"
                                                  >
                                                    {getShiftShortLabel(division.shift)}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  <Users className="size-3 text-muted-foreground" />
                                                  <span className="text-xs text-muted-foreground">
                                                    {division.studentCount} alumnos
                                                  </span>
                                                  {division.preceptorName && (
                                                    <span className="text-xs text-muted-foreground">
                                                      - {division.preceptorName}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              {isDivisionSelected && (
                                                <Check className="size-4 text-primary" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        <div className="p-3 border-t border-glass-border bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Selecciona un curso para cargar asistencia, notas o sanciones
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// COMPACT SELECTOR FOR MOBILE
// ============================================

export function ContextSelectorCompact() {
  const { currentCourse, currentDivision, currentLevel, isContextComplete } =
    useSchoolContext();

  if (!isContextComplete || !currentCourse || !currentDivision || !currentLevel) {
    return (
      <Badge variant="outline" className="text-xs">
        Sin curso
      </Badge>
    );
  }

  const Icon = LEVEL_ICONS[currentLevel];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "size-5 rounded flex items-center justify-center",
          LEVEL_COLORS[currentLevel]
        )}
      >
        <Icon className="size-3" />
      </div>
      <span className="text-xs font-medium">
        {currentCourse.year}° &quot;{currentDivision.name}&quot;
      </span>
    </div>
  );
}

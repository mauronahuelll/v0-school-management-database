"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Award,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GradeScale } from "@/lib/types/grades";
import { roundToDecimals, isPassingGrade, formatGrade } from "@/lib/types/grades";

// ============================================
// TYPES FOR MOBILE VIEW (Parent's App)
// ============================================

interface SubjectGradeSummary {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  currentAverage: number | null;
  previousAverage?: number | null; // Previous period for trend
  grades: {
    id: string;
    name: string;
    value: number | null;
    conceptual: string | null;
    date: Date;
    feedback?: string;
  }[];
  isPassing: boolean;
  scale: GradeScale;
}

interface StudentGradeCardProps {
  studentName: string;
  periodName: string;
  subjects: SubjectGradeSummary[];
  generalAverage: number | null;
  onSubjectClick?: (subjectId: string) => void;
}

export function StudentGradeCard({
  studentName,
  periodName,
  subjects,
  generalAverage,
  onSubjectClick,
}: StudentGradeCardProps) {
  const passingSubjects = subjects.filter((s) => s.isPassing).length;
  const totalSubjects = subjects.length;

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      {/* Header - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground text-balance">
              Libreta Digital
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {studentName} - {periodName}
            </p>
          </div>
          <div
            className={cn(
              "size-14 rounded-2xl flex items-center justify-center font-bold text-xl",
              generalAverage !== null && generalAverage >= 6
                ? "bg-status-present text-status-present-foreground"
                : generalAverage !== null
                ? "bg-status-absent text-status-absent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {generalAverage !== null ? roundToDecimals(generalAverage).toFixed(1) : "-"}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Award className="size-4 text-status-present" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{passingSubjects}</strong> de{" "}
              {totalSubjects} aprobadas
            </span>
          </div>
          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(passingSubjects / totalSubjects) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-status-present rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Subject Cards */}
      <div className="space-y-3">
        {subjects.map((subject, index) => (
          <SubjectCard
            key={subject.subjectId}
            subject={subject}
            index={index}
            onClick={() => onSubjectClick?.(subject.subjectId)}
          />
        ))}
      </div>

      {/* Footer Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-muted-foreground mt-8 px-4"
      >
        Las notas son actualizadas por los docentes. Consultanos ante cualquier
        duda.
      </motion.p>
    </div>
  );
}

// ============================================
// SUBJECT CARD SUB-COMPONENT
// ============================================

interface SubjectCardProps {
  subject: SubjectGradeSummary;
  index: number;
  onClick?: () => void;
}

function SubjectCard({ subject, index, onClick }: SubjectCardProps) {
  const { subjectName, teacherName, currentAverage, previousAverage, isPassing, grades, scale } =
    subject;

  // Calculate trend
  const trend =
    currentAverage !== null && previousAverage !== null
      ? currentAverage > previousAverage
        ? "up"
        : currentAverage < previousAverage
        ? "down"
        : "stable"
      : null;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-status-present"
      : trend === "down"
      ? "text-status-absent"
      : "text-muted-foreground";

  // Get last 3 grades for quick preview
  const recentGrades = grades.slice(-3).reverse();

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 active:scale-[0.99]",
        "bg-card border-border",
        !isPassing && currentAverage !== null && "border-status-absent/30 bg-status-absent-soft/10"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Subject Icon */}
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center shrink-0",
            isPassing || currentAverage === null
              ? "bg-primary/10 text-primary"
              : "bg-status-absent-soft text-status-absent"
          )}
        >
          <BookOpen className="size-5" />
        </div>

        {/* Subject Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {subjectName}
            </h3>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground">{teacherName}</p>

          {/* Recent Grades Preview */}
          {recentGrades.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {recentGrades.map((grade) => (
                <div
                  key={grade.id}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    grade.value !== null && isPassingGrade(grade.value, scale)
                      ? "bg-status-present-soft/50 text-status-present-foreground"
                      : grade.value !== null
                      ? "bg-status-absent-soft/50 text-status-absent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {formatGrade(grade.value, grade.conceptual, scale)}
                </div>
              ))}
              {grades.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{grades.length - 3} mas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Average & Trend */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className={cn(
              "size-12 rounded-xl flex items-center justify-center font-bold text-lg",
              isPassing
                ? "bg-status-present text-status-present-foreground"
                : currentAverage !== null
                ? "bg-status-absent text-status-absent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {currentAverage !== null
              ? roundToDecimals(currentAverage).toFixed(1)
              : "-"}
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
              <TrendIcon className="size-3" />
              <span>
                {previousAverage !== null
                  ? Math.abs(
                      roundToDecimals(currentAverage! - previousAverage)
                    ).toFixed(1)
                  : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================
// SUBJECT DETAIL VIEW (Modal/Sheet)
// ============================================

interface SubjectDetailProps {
  subject: SubjectGradeSummary;
  onClose: () => void;
}

export function SubjectDetail({ subject, onClose }: SubjectDetailProps) {
  const { subjectName, teacherName, grades, scale, currentAverage, isPassing } = subject;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-foreground">{subjectName}</h2>
            <p className="text-sm text-muted-foreground">{teacherName}</p>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Average Banner */}
        <div
          className={cn(
            "mt-4 p-4 rounded-xl flex items-center justify-between",
            isPassing
              ? "bg-status-present-soft/50"
              : currentAverage !== null
              ? "bg-status-absent-soft/50"
              : "bg-muted/50"
          )}
        >
          <div>
            <p className="text-sm text-muted-foreground">Promedio Actual</p>
            <p
              className={cn(
                "text-3xl font-bold",
                isPassing
                  ? "text-status-present-foreground"
                  : currentAverage !== null
                  ? "text-status-absent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {currentAverage !== null
                ? roundToDecimals(currentAverage).toFixed(2)
                : "Sin notas"}
            </p>
          </div>
          <Badge
            className={cn(
              "px-3 py-1.5",
              isPassing
                ? "bg-status-present text-status-present-foreground"
                : currentAverage !== null
                ? "bg-status-absent text-status-absent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isPassing ? "Aprobado" : currentAverage !== null ? "Desaprobado" : "Pendiente"}
          </Badge>
        </div>
      </div>

      {/* Grades List */}
      <div className="px-4 py-6 space-y-3">
        <h3 className="font-semibold text-foreground mb-4">Historial de Notas</h3>

        {grades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="size-12 mx-auto mb-4 opacity-50" />
            <p>Aun no hay notas cargadas</p>
          </div>
        ) : (
          grades.map((grade, index) => (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{grade.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {new Date(grade.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {grade.feedback && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                      {grade.feedback}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "size-14 rounded-xl flex items-center justify-center font-bold text-xl shrink-0",
                    grade.value !== null && isPassingGrade(grade.value, scale)
                      ? "bg-status-present text-status-present-foreground"
                      : grade.value !== null
                      ? "bg-status-absent text-status-absent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {formatGrade(grade.value, grade.conceptual, scale)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

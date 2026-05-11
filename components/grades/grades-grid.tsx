"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Users,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GradeCell } from "./grade-cell";
import { PublicationBanner } from "./publication-banner";
import { ThemeToggleCompact } from "@/components/theme-toggle";
import type {
  CourseGradeInfo,
  StudentGradeRow,
  GradeEntry,
  AssessmentConfig,
} from "@/lib/types/grades";
import {
  roundToDecimals,
  calculateWeightedAverage,
  isPassingGrade,
  ASSESSMENT_TYPE_LABELS,
} from "@/lib/types/grades";

interface GradesGridProps {
  courseInfo: CourseGradeInfo;
  onGradeUpdate: (
    studentId: string,
    assessmentId: string,
    value: number | null
  ) => Promise<void>;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  canPublish: boolean;
  isReadOnly?: boolean;
}

type SortField = "name" | "average" | "status";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "passing" | "failing" | "incomplete";

export function GradesGrid({
  courseInfo,
  onGradeUpdate,
  onPublish,
  onUnpublish,
  canPublish,
  isReadOnly = false,
}: GradesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const { subject, assessments, students, periodName, courseName, divisionName } =
    courseInfo;
  const scale = subject.gradeScale;

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.enrollmentNumber.includes(query)
      );
    }

    // Apply status filter
    switch (filterType) {
      case "passing":
        result = result.filter(
          (s) => s.average !== null && isPassingGrade(s.average, scale)
        );
        break;
      case "failing":
        result = result.filter(
          (s) => s.average !== null && !isPassingGrade(s.average, scale)
        );
        break;
      case "incomplete":
        result = result.filter((s) => !s.isComplete);
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`
          );
          break;
        case "average":
          const avgA = a.average ?? -1;
          const avgB = b.average ?? -1;
          comparison = avgA - avgB;
          break;
        case "status":
          const statusA = a.isPassing ? 1 : a.average !== null ? 0 : -1;
          const statusB = b.isPassing ? 1 : b.average !== null ? 0 : -1;
          comparison = statusA - statusB;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [students, searchQuery, filterType, sortField, sortDirection, scale]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getFilterLabel = (filter: FilterType): string => {
    const labels: Record<FilterType, string> = {
      all: "Todos",
      passing: "Aprobados",
      failing: "Desaprobados",
      incomplete: "Incompletos",
    };
    return labels[filter];
  };

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const withGrades = students.filter((s) => s.average !== null).length;
    const passing = students.filter(
      (s) => s.average !== null && isPassingGrade(s.average, scale)
    ).length;

    return { total, withGrades, passing, failing: withGrades - passing };
  }, [students, scale]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Course Info */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-lg">
                  {subject.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {courseName} {divisionName} - {periodName}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <StatBadge
                icon={Users}
                value={`${stats.withGrades}/${stats.total}`}
                label="cargadas"
              />
              <StatBadge
                icon={Eye}
                value={String(stats.passing)}
                label="aprobados"
                variant="success"
              />
              <StatBadge
                icon={EyeOff}
                value={String(stats.failing)}
                label="desaprob."
                variant={stats.failing > 0 ? "danger" : "neutral"}
              />
            </div>

            <ThemeToggleCompact />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Publication Banner */}
        <PublicationBanner
          periodName={periodName}
          subjectName={subject.name}
          status={courseInfo.publicationStatus}
          students={students}
          scale={scale}
          lastPublishedAt={courseInfo.lastPublishedAt}
          lastPublishedBy={courseInfo.lastPublishedBy}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
          canPublish={canPublish}
        />

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alumno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 transition-theme"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <Filter className="size-4" />
                {getFilterLabel(filterType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["all", "passing", "failing", "incomplete"] as FilterType[]).map(
                (filter) => (
                  <DropdownMenuItem
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={cn(filterType === filter && "bg-accent")}
                  >
                    {getFilterLabel(filter)}
                    {filter !== "all" && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {filter === "passing"
                          ? stats.passing
                          : filter === "failing"
                          ? stats.failing
                          : students.filter((s) => !s.isComplete).length}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Grades Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-theme">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {/* Student Name Column */}
                  <th className="sticky left-0 z-20 bg-muted/30 backdrop-blur-sm">
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-2 px-4 py-4 text-left text-sm font-semibold text-foreground hover:text-primary transition-colors w-full"
                    >
                      Alumno
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <SortAsc className="size-4" />
                        ) : (
                          <SortDesc className="size-4" />
                        ))}
                    </button>
                  </th>

                  {/* Assessment Columns */}
                  {assessments.map((assessment) => (
                    <th
                      key={assessment.id}
                      className="px-3 py-4 text-center min-w-[80px]"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground truncate max-w-[100px]">
                                {assessment.name}
                              </p>
                              <div className="flex items-center justify-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {ASSESSMENT_TYPE_LABELS[assessment.type]}
                                </Badge>
                                {assessment.weight !== 1 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    x{assessment.weight}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {assessment.name} - {ASSESSMENT_TYPE_LABELS[assessment.type]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Peso: {assessment.weight}x | Max: {assessment.maxValue}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}

                  {/* Average Column */}
                  <th className="px-4 py-4 text-center min-w-[100px] bg-accent/30">
                    <button
                      onClick={() => toggleSort("average")}
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full"
                    >
                      Promedio
                      {sortField === "average" &&
                        (sortDirection === "asc" ? (
                          <SortAsc className="size-4" />
                        ) : (
                          <SortDesc className="size-4" />
                        ))}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {filteredStudents.map((student, index) => (
                  <StudentRow
                    key={student.studentId}
                    student={student}
                    assessments={assessments}
                    scale={scale}
                    isPublished={courseInfo.publicationStatus === "PUBLISHED"}
                    onGradeUpdate={onGradeUpdate}
                    isReadOnly={isReadOnly}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No se encontraron alumnos
              </h3>
              <p className="text-sm text-muted-foreground">
                Intenta ajustar los filtros o la busqueda
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================
// STUDENT ROW SUB-COMPONENT
// ============================================

interface StudentRowProps {
  student: StudentGradeRow;
  assessments: AssessmentConfig[];
  scale: {
    type: string;
    minPassing: number;
    maxGrade: number;
    conceptualValues?: string[];
  };
  isPublished: boolean;
  onGradeUpdate: (
    studentId: string,
    assessmentId: string,
    value: number | null
  ) => Promise<void>;
  isReadOnly: boolean;
  index: number;
}

function StudentRow({
  student,
  assessments,
  scale,
  isPublished,
  onGradeUpdate,
  isReadOnly,
  index,
}: StudentRowProps) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const passing = student.average !== null && isPassingGrade(student.average, scale);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "group hover:bg-accent/30 transition-colors",
        !student.isComplete && "bg-status-tardy-soft/20"
      )}
    >
      {/* Student Info */}
      <td className="sticky left-0 z-10 bg-card group-hover:bg-accent/30 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="size-10 ring-2 ring-border/50">
            <AvatarImage src={student.photoUrl} alt={student.firstName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {student.lastName}, {student.firstName}
            </p>
            <p className="text-xs text-muted-foreground">
              Legajo: {student.enrollmentNumber}
            </p>
          </div>
        </div>
      </td>

      {/* Grade Cells */}
      {assessments.map((assessment) => {
        const grade = student.grades[assessment.id] || null;
        return (
          <td key={assessment.id} className="px-3 py-4 text-center">
            <GradeCell
              grade={grade}
              assessmentId={assessment.id}
              studentId={student.studentId}
              scale={scale}
              maxValue={assessment.maxValue}
              isPublished={isPublished}
              onUpdate={onGradeUpdate}
              disabled={isReadOnly}
            />
          </td>
        );
      })}

      {/* Average */}
      <td className="px-4 py-4 text-center bg-accent/20">
        <div
          className={cn(
            "inline-flex items-center justify-center size-12 rounded-xl font-bold text-lg transition-all",
            student.average !== null
              ? passing
                ? "bg-status-present text-status-present-foreground"
                : "bg-status-absent text-status-absent-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {student.average !== null
            ? roundToDecimals(student.average).toFixed(1)
            : "-"}
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================
// STAT BADGE SUB-COMPONENT
// ============================================

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  variant?: "neutral" | "success" | "danger";
}

function StatBadge({ icon: Icon, value, label, variant = "neutral" }: StatBadgeProps) {
  const variantClasses = {
    neutral: "bg-muted/50 text-muted-foreground",
    success: "bg-status-present-soft/50 text-status-present-foreground",
    danger: "bg-status-absent-soft/50 text-status-absent-foreground",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-theme",
        variantClasses[variant]
      )}
    >
      <Icon className="size-4" />
      <span className="font-semibold">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}
